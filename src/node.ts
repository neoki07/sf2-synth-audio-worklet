import {
  type PresetHeader,
  type SoundFont2SynthNodeMessageData,
  type SoundFont2SynthProcessorMessageData,
} from './types'

export interface SoundFont2SynthNode extends AudioWorkletNode {
  noteOn: (channel: number, key: number, vel: number, delayTime: number) => void

  noteOff: (channel: number, key: number, delayTime: number) => void

  getPresetHeaders: () => Promise<PresetHeader[]>
  setProgram: (channel: number, bank: number, preset: number) => void
}

let _presetHeaders: PresetHeader[] | undefined

export class SoundFont2SynthNodeImpl
  extends AudioWorkletNode
  implements SoundFont2SynthNode
{
  private initCompletedSynthCallback?: () => void
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
  async init(wasmBytes: ArrayBuffer, sf2Bytes: ArrayBuffer): Promise<void> {
    this.port.onmessage = (event) => {
      this.onmessage(event)
    }

    const data: SoundFont2SynthProcessorMessageData = {
      type: 'send-wasm-module',
      wasmBytes,
      sf2Bytes,
    }

    await new Promise<void>((resolve) => {
      this.initCompletedSynthCallback = resolve
      this.port.postMessage(data)
    })
  }

  onprocessorerror = (): void => {
    console.error('An error from SoundFont2SynthProcessor.process() occurred')
  }

  onmessage(event: MessageEvent<SoundFont2SynthNodeMessageData>): void {
    const data = event.data

    switch (data.type) {
      case 'wasm-module-loaded': {
        const data: SoundFont2SynthProcessorMessageData = {
          type: 'init-synth',
          sampleRate: this.context.sampleRate,
        }
        this.port.postMessage(data)
        break
      }
      case 'init-completed-synth': {
        this.initCompletedSynthCallback?.()
        break
      }
      case 'got-preset-headers':
        _presetHeaders = data.presetHeaders
        break
      default:
        break
    }
  }

  noteOn(channel: number, key: number, vel: number, delayTime: number): void {
    const data: SoundFont2SynthProcessorMessageData = {
      type: 'note-on',
      channel,
      key,
      vel,
      delayTime: delayTime * this.sampleRate,
    }
    this.port.postMessage(data)
  }

  noteOff(channel: number, key: number, delayTime: number): void {
    const data: SoundFont2SynthProcessorMessageData = {
      type: 'note-off',
      channel,
      key,
      delayTime: delayTime * this.sampleRate,
    }
    this.port.postMessage(data)
  }

  async getPresetHeaders(): Promise<PresetHeader[]> {
    _presetHeaders = undefined
    const data: SoundFont2SynthProcessorMessageData = {
      type: 'get-preset-headers',
    }
    this.port.postMessage(data)

    return await new Promise(waitToGetPresetHeaders)
  }

  setProgram(channel: number, bank: number, preset: number): void {
    const data: SoundFont2SynthProcessorMessageData = {
      type: 'set-program',
      channel,
      bank,
      preset,
    }
    this.port.postMessage(data)
  }
}

const waitToGetPresetHeaders = (
  resolve: (value: PromiseLike<PresetHeader[]> | PresetHeader[]) => void
): void => {
  if (_presetHeaders !== undefined) {
    const presetHeaders = _presetHeaders
    _presetHeaders = undefined
    resolve(presetHeaders)
  } else {
    setTimeout(waitToGetPresetHeaders.bind(this, resolve), 500)
  }
}
