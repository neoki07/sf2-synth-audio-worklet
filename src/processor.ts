import { PROCESSOR_NAME } from './constants.js'
import './TextEncoder.js'

import {
  PresetHeader,
  SoundFont2SynthNodeMessageData,
  SoundFont2SynthProcessorMessageData,
} from '@/types'
import init, {
  WasmSoundFontSynth,
} from './generated/wasm/sf2_synth_audio_worklet_wasm'

interface SoundFont2SynthProcessor {
  noteOn(channel: number, key: number, vel: number, delayTime: number): void

  noteOff(channel: number, key: number, delayTime: number): void

  getPresetHeaders(): void
  setProgram(channel: number, bank: number, preset: number): void
}

class SoundFont2SynthProcessorImpl
  extends AudioWorkletProcessor
  implements SoundFont2SynthProcessor
{
  synth?: WasmSoundFontSynth
  sf2Bytes?: ArrayBuffer

  constructor() {
    super()

    this.port.onmessage = (event) => this.onmessage(event)

    this.synth = undefined
    this.sf2Bytes = undefined
  }

  onmessage(event: MessageEvent<SoundFont2SynthProcessorMessageData>) {
    const data = event.data

    switch (data.type) {
      case 'send-wasm-module':
        init(WebAssembly.compile(data.wasmBytes)).then(() => {
          this.port.postMessage({
            type: 'wasm-module-loaded',
          } as SoundFont2SynthNodeMessageData)
        })
        this.sf2Bytes = data.sf2Bytes
        break
      case 'init-synth':
        if (!this.sf2Bytes) {
          throw new Error('sf2Bytes is undefined')
        }

        this.synth = WasmSoundFontSynth.new(
          new Uint8Array(this.sf2Bytes),
          data.sampleRate
        )
        break
      case 'note-on':
        this.noteOn(data.channel, data.key, data.vel, data.delayTime)
        break
      case 'note-off':
        this.noteOff(data.channel, data.key, data.delayTime)
        break
      case 'get-preset-headers':
        this.getPresetHeaders()
        break
      case 'set-program':
        this.setProgram(data.channel, data.bank, data.preset)
        break
      default:
        break
    }
  }

  noteOn(channel: number, key: number, vel: number, delayTime?: number) {
    if (!this.synth) return
    this.synth.note_on(channel, key, vel, delayTime)
  }

  noteOff(channel: number, key: number, delayTime?: number) {
    if (!this.synth) return
    this.synth.note_off(channel, key, delayTime)
  }

  getPresetHeaders() {
    if (!this.synth) return
    const presetHeaders: PresetHeader[] = this.synth.get_preset_headers()
    this.port.postMessage({
      type: 'got-preset-headers',
      presetHeaders,
    } as SoundFont2SynthNodeMessageData)
  }

  setProgram(channel: number, bank: number, preset: number) {
    if (!this.synth) return
    this.synth.program_select(channel, bank, preset)
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    if (!this.synth) return true

    const outputChannels = outputs[0]
    const blockSize = outputChannels[0].length
    const next_block = this.synth.read_next_block(blockSize)
    outputChannels[0].set(next_block[0])
    outputChannels.length > 1 && outputChannels[1].set(next_block[1])

    // Returning true tells the Audio system to keep going.
    return true
  }
}

registerProcessor(PROCESSOR_NAME, SoundFont2SynthProcessorImpl)
