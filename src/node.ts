import {
  PresetHeader,
  SoundFont2SynthNodeMessageData,
  SoundFont2SynthProcessorMessageData,
} from '@/types'

export interface SoundFont2SynthNode {
  noteOn(channel: number, key: number, vel: number, delayTime: number): void

  noteOff(channel: number, key: number, delayTime: number): void

  getPresetHeaders(): Promise<PresetHeader[]>
  setProgram(channel: number, bank: number, preset: number): void
}

let _presetHeaders: PresetHeader[] | undefined = undefined

export class SoundFont2SynthNodeImpl
  extends AudioWorkletNode
  implements SoundFont2SynthNode
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
      type: 'send-wasm-module',
      wasmBytes,
      sf2Bytes,
    } as SoundFont2SynthProcessorMessageData)
  }

  onprocessorerror = (err: Event) => {
    console.log(
      `An error from SoundFont2SynthProcessor.process() occurred: ${err}`
    )
  }

  onmessage(event: MessageEvent<SoundFont2SynthNodeMessageData>) {
    const data = event.data

    switch (data.type) {
      case 'wasm-module-loaded':
        this.port.postMessage({
          type: 'init-synth',
          sampleRate: this.context.sampleRate,
        } as SoundFont2SynthProcessorMessageData)
        break
      case 'got-preset-headers':
        _presetHeaders = data.presetHeaders
        break
      default:
        break
    }
  }

  noteOn(channel: number, key: number, vel: number, delayTime: number) {
    this.port.postMessage({
      type: 'note-on',
      channel,
      key,
      vel,
      delayTime: delayTime * this.sampleRate,
    } as SoundFont2SynthProcessorMessageData)
  }

  noteOff(channel: number, key: number, delayTime: number) {
    this.port.postMessage({
      type: 'note-off',
      channel,
      key,
      delayTime: delayTime * this.sampleRate,
    } as SoundFont2SynthProcessorMessageData)
  }

  getPresetHeaders(): Promise<PresetHeader[]> {
    _presetHeaders = undefined
    this.port.postMessage({
      type: 'get-preset-headers',
    } as SoundFont2SynthProcessorMessageData)

    return new Promise(waitToGetPresetHeaders)
  }

  setProgram(channel: number, bank: number, preset: number) {
    this.port.postMessage({
      type: 'set-program',
      channel,
      bank,
      preset,
    } as SoundFont2SynthProcessorMessageData)
  }
}

const waitToGetPresetHeaders = (
  resolve: (value: PromiseLike<PresetHeader[]> | PresetHeader[]) => void
) => {
  if (_presetHeaders !== undefined) {
    const presetHeaders = _presetHeaders
    _presetHeaders = undefined
    resolve(presetHeaders)
  } else {
    setTimeout(waitToGetPresetHeaders.bind(this, resolve), 500)
  }
}
