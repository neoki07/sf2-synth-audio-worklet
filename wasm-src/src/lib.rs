mod utils;

use std::io::Cursor;

use oxisynth::{MidiEvent, SoundFont, SoundFontId, Synth, SynthDescriptor};
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

struct ScheduledMidiEvent {
    frame: usize,
    event: MidiEvent,
}

#[derive(Serialize, Deserialize)]
pub struct SerializablePresetHeader {
    /// The name of the preset
    pub name: String,
    /// The MIDI preset number which to apply to the preset.
    pub preset: u16,
    /// The preset bank
    pub bank: u16,
    pub bag_id: u16,

    /// Reserved?
    pub library: u32,
    /// Reserved?
    pub genre: u32,
    /// Reserved?
    pub morphology: u32,
}

#[wasm_bindgen]
pub struct WasmSoundFontSynth {
    synth: Synth,
    font_id: SoundFontId,
    preset_headers: Vec<SerializablePresetHeader>,
    current_frame: usize,
    scheduled_events: Vec<ScheduledMidiEvent>,
}

#[wasm_bindgen]
impl WasmSoundFontSynth {
    pub fn new(sf2_bytes: &[u8], sample_rate: f32) -> WasmSoundFontSynth {
        utils::set_panic_hook();

        let mut synth = Synth::new(SynthDescriptor {
            sample_rate,
            ..Default::default()
        })
        .unwrap();

        let mut cur = Cursor::new(sf2_bytes);
        let font = SoundFont::load(&mut cur).unwrap();
        let font_id = synth.add_font(font, true);

        let sf2 = soundfont::SoundFont2::load(&mut cur).unwrap();
        let mut preset_headers = sf2
            .presets
            .iter()
            .map(|p| SerializablePresetHeader {
                name: p.header.name.clone(),
                preset: p.header.preset,
                bank: p.header.bank,
                bag_id: p.header.bag_id,
                library: p.header.library,
                genre: p.header.genre,
                morphology: p.header.morphology,
            })
            .collect::<Vec<SerializablePresetHeader>>();
        preset_headers.sort_by(|a, b| a.bank.cmp(&b.bank).then(a.preset.cmp(&b.preset)));

        WasmSoundFontSynth {
            synth,
            font_id,
            preset_headers,
            current_frame: 0,
            scheduled_events: vec![],
        }
    }

    pub fn get_preset_headers(&self) -> JsValue {
        serde_wasm_bindgen::to_value(&self.preset_headers).unwrap()
    }

    pub fn program_select(&mut self, chan: u8, bank_num: u32, preset_num: u8) {
        self.synth
            .program_select(chan, self.font_id, bank_num, preset_num)
            .ok();
    }

    pub fn note_on(&mut self, channel: u8, key: u8, vel: u8, delay_frame: Option<usize>) {
        if let Some(delay_frame) = delay_frame {
            let frame = self.current_frame + delay_frame;
            let idx = self.scheduled_events.partition_point(|e| e.frame > frame);

            self.scheduled_events.insert(
                idx,
                ScheduledMidiEvent {
                    frame,
                    event: MidiEvent::NoteOn { channel, key, vel },
                },
            );
        } else {
            self.note_on_immediately(channel, key, vel);
        }
    }

    fn note_on_immediately(&mut self, channel: u8, key: u8, vel: u8) {
        self.synth
            .send_event(MidiEvent::NoteOn { channel, key, vel })
            .ok();
    }

    pub fn note_off(&mut self, channel: u8, key: u8, delay_frame: Option<usize>) {
        if let Some(delay_frame) = delay_frame {
            let frame = self.current_frame + delay_frame;
            let idx = self.scheduled_events.partition_point(|e| e.frame > frame);

            self.scheduled_events.insert(
                idx,
                ScheduledMidiEvent {
                    frame,
                    event: MidiEvent::NoteOff { channel, key },
                },
            );
        } else {
            self.note_off_immediately(channel, key);
        }
    }

    fn note_off_immediately(&mut self, channel: u8, key: u8) {
        self.synth
            .send_event(MidiEvent::NoteOff { channel, key })
            .ok();
    }

    fn process_scheduled_events(&mut self) {
        while let Some(event) = self.scheduled_events.last() {
            if event.frame > self.current_frame {
                break;
            }

            match event.event {
                MidiEvent::NoteOn { channel, key, vel } => {
                    self.note_on_immediately(channel, key, vel)
                }
                MidiEvent::NoteOff { channel, key } => self.note_off_immediately(channel, key),
                _ => (),
            }

            self.scheduled_events.pop();
        }
    }

    pub fn read_next_block(&mut self, block_size: usize) -> JsValue {
        self.current_frame += block_size;
        self.process_scheduled_events();

        let mut out = vec![
            Vec::with_capacity(block_size),
            Vec::with_capacity(block_size),
        ];

        for _ in 0..block_size {
            let (l, r) = self.synth.read_next();
            out[0].push(l);
            out[1].push(r);
        }

        serde_wasm_bindgen::to_value(&out).unwrap()
    }
}
