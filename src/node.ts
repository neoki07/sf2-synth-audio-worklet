import { SoundFont2SynthMessageType } from './constants'

interface ISoundFont2SynthNode {
  noteOn(channel: number, key: number, vel: number, delayTime: number): void
  noteOff(channel: number, key: number, delayTime: number): void
}

export class SoundFont2SynthNode
  extends AudioWorkletNode
  implements ISoundFont2SynthNode
{
  sampleRate: number

  constructor(
    context: BaseAudioContext,
    name: string,
    options?: AudioWorkletNodeOptions
  ) {
    super(context, name, options)
    this.sampleRate = 44100
  }

  /**
   * @param {ArrayBuffer} wasmBytes
   * @param {ArrayBuffer} sf2Bytes
   */
  init(wasmBytes: ArrayBuffer, sf2Bytes: ArrayBuffer) {
    this.port.onmessage = (event) => this.onmessage(event)

    this.port.postMessage({
      type: SoundFont2SynthMessageType.SendWasmModule,
      wasmBytes,
      sf2Bytes,
    })
  }

  onprocessorerror = (err: Event) => {
    console.log(
      `An error from SoundFont2SynthProcessor.process() occurred: ${err}`
    )
  }

  onmessage(event: MessageEvent) {
    if (event.data.type === SoundFont2SynthMessageType.WasmModuleLoaded) {
      this.port.postMessage({
        type: SoundFont2SynthMessageType.InitSynth,
        sampleRate: this.context.sampleRate,
      })
    }
  }

  noteOn(channel: number, key: number, vel: number, delayTime: number) {
    this.port.postMessage({
      type: SoundFont2SynthMessageType.NoteOn,
      channel,
      key,
      vel,
      delayTime: delayTime * this.sampleRate,
    })
  }

  noteOff(channel: number, key: number, delayTime: number) {
    this.port.postMessage({
      type: SoundFont2SynthMessageType.NoteOff,
      channel,
      key,
      delayTime: delayTime * this.sampleRate,
    })
  }
}
