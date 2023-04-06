import './text-encoder-decoder.js'

import { PROCESSOR_NAME } from './constants.js'
import init, {
  WasmSoundFontSynth,
} from './generated/wasm/sf2_synth_audio_worklet_wasm'
import {
  type PresetHeader,
  type SoundFont2SynthNodeMessageData,
  type SoundFont2SynthProcessorMessageData,
} from './types'

interface SoundFont2SynthProcessor extends AudioWorkletProcessor {
  noteOn: (channel: number, key: number, vel: number, delayTime: number) => void

  noteOff: (channel: number, key: number, delayTime: number) => void

  getPresetHeaders: () => void
  setProgram: (channel: number, bank: number, preset: number) => void
}

class SoundFont2SynthProcessorImpl
  extends AudioWorkletProcessor
  implements SoundFont2SynthProcessor
{
  synth?: WasmSoundFontSynth
  sf2Bytes?: ArrayBuffer

  constructor() {
    super()

    this.port.onmessage = (event) => {
      this.onmessage(event)
    }

    this.synth = undefined
    this.sf2Bytes = undefined
  }

  onmessage(event: MessageEvent<SoundFont2SynthProcessorMessageData>): void {
    const data = event.data

    switch (data.type) {
      case 'send-wasm-module':
        init(WebAssembly.compile(data.wasmBytes))
          .then(() => {
            const data: SoundFont2SynthNodeMessageData = {
              type: 'wasm-module-loaded',
            }
            this.port.postMessage(data)
          })
          .catch(() => {
            console.error('An error occurred during wasm initialization')
          })
        this.sf2Bytes = data.sf2Bytes
        break
      case 'init-synth': {
        if (this.sf2Bytes == null) {
          throw new Error('sf2Bytes is undefined')
        }

        this.synth = WasmSoundFontSynth.new(
          new Uint8Array(this.sf2Bytes),
          data.sampleRate
        )

        const postData: SoundFont2SynthNodeMessageData = {
          type: 'init-completed-synth',
        }
        this.port.postMessage(postData)
        break
      }
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

  noteOn(channel: number, key: number, vel: number, delayTime?: number): void {
    if (this.synth == null) return
    this.synth.note_on(channel, key, vel, delayTime)
  }

  noteOff(channel: number, key: number, delayTime?: number): void {
    if (this.synth == null) return
    this.synth.note_off(channel, key, delayTime)
  }

  getPresetHeaders(): void {
    if (this.synth == null) return
    const presetHeaders: PresetHeader[] = this.synth.get_preset_headers()
    const data: SoundFont2SynthNodeMessageData = {
      type: 'got-preset-headers',
      presetHeaders,
    }
    this.port.postMessage(data)
  }

  setProgram(channel: number, bank: number, preset: number): void {
    if (this.synth == null) return
    this.synth.program_select(channel, bank, preset)
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    if (this.synth == null) return true

    const outputChannels = outputs[0]
    const blockSize = outputChannels[0].length
    const nextBlock = this.synth.read_next_block(blockSize)
    outputChannels[0].set(nextBlock[0])
    outputChannels.length > 1 && outputChannels[1].set(nextBlock[1])

    // Returning true tells the Audio system to keep going.
    return true
  }
}

registerProcessor(PROCESSOR_NAME, SoundFont2SynthProcessorImpl)
