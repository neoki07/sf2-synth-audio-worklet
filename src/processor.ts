import './TextEncoder.js'
import { PROCESSOR_NAME, SoundFont2SynthMessageType } from './constants.js'

import init, {
  WasmSoundFontSynth,
} from './generated/wasm/sf2_synth_audio_worklet_wasm'

interface ISoundFont2SynthProcessor {
  noteOn(channel: number, key: number, vel: number, delayTime: number): void
  noteOff(channel: number, key: number, delayTime: number): void
}

class SoundFont2SynthProcessor
  extends AudioWorkletProcessor
  implements ISoundFont2SynthProcessor
{
  synth?: WasmSoundFontSynth
  sf2Bytes?: ArrayBuffer

  constructor() {
    super()

    this.port.onmessage = (event) => this.onmessage(event)

    this.synth = undefined
    this.sf2Bytes = undefined
  }

  onmessage(event: MessageEvent) {
    const data = event.data
    if (data.type === SoundFont2SynthMessageType.SendWasmModule) {
      init(WebAssembly.compile(data.wasmBytes)).then(() => {
        this.port.postMessage({
          type: SoundFont2SynthMessageType.WasmModuleLoaded,
        })
      })
      this.sf2Bytes = data.sf2Bytes
    } else if (data.type === SoundFont2SynthMessageType.InitSynth) {
      if (!this.sf2Bytes) {
        throw new Error('sf2Bytes is undefined')
      }

      this.synth = WasmSoundFontSynth.new(
        new Uint8Array(this.sf2Bytes),
        data.sampleRate
      )
    } else if (data.type === SoundFont2SynthMessageType.NoteOn) {
      this.noteOn(data.channel, data.key, data.vel, data.delayTime)
    } else if (data.type === SoundFont2SynthMessageType.NoteOff) {
      this.noteOff(data.channel, data.key, data.delayTime)
    }
  }

  noteOn(channel: number, key: number, vel: number, delayTime: number) {
    if (!this.synth) return
    this.synth.note_on(channel, key, vel, delayTime)
  }

  noteOff(channel: number, key: number, delayTime: number) {
    if (!this.synth) return
    this.synth.note_off(channel, key, delayTime)
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

registerProcessor(PROCESSOR_NAME, SoundFont2SynthProcessor)
