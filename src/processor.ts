import './TextEncoder.js'
import { PROCESSOR_NAME } from './constants.js'

import init, {
  WasmSoundFontSynth,
} from './generated/wasm/sf2_synth_audio_worklet_wasm'

class SoundFont2SynthProcessor extends AudioWorkletProcessor {
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
    if (data.type === 'send-wasm-module') {
      init(WebAssembly.compile(data.wasmBytes)).then(() => {
        this.port.postMessage({ type: 'wasm-module-loaded' })
      })
      this.sf2Bytes = data.sf2Bytes
    } else if (data.type === 'init-synth') {
      if (!this.sf2Bytes) {
        throw new Error('sf2Bytes is undefined')
      }

      this.synth = WasmSoundFontSynth.new(
        new Uint8Array(this.sf2Bytes),
        data.sampleRate
      )

      this.port.postMessage({ type: 'synth-initialized' })
    } else if (data.type === 'send-note-on-event') {
      if (!this.synth) return
      this.synth.note_on(
        data.channel,
        data.key,
        data.vel,
        data.delayTime * data.sampleRate
      )
    } else if (data.type === 'send-note-off-event') {
      if (!this.synth) return
      this.synth.note_off(
        data.channel,
        data.key,
        data.delayTime * data.sampleRate
      )
    }
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
