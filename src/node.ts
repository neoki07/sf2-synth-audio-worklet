import {SoundFont2SynthMessageType} from './constants'
import {PresetHeader} from "@/types";

interface ISoundFont2SynthNode {
  noteOn(channel: number, key: number, vel: number, delayTime: number): void

  noteOff(channel: number, key: number, delayTime: number): void

  getPresetHeaders(): Promise<PresetHeader[]>
  setProgram(channel: number, bank: number, preset: number): void
}

let _presetHeaders: PresetHeader[] | undefined = undefined;

export class SoundFont2SynthNode
  extends AudioWorkletNode
  implements ISoundFont2SynthNode {
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
    const data = event.data;
    if (data.type === SoundFont2SynthMessageType.WasmModuleLoaded) {
      this.port.postMessage({
        type: SoundFont2SynthMessageType.InitSynth,
        sampleRate: this.context.sampleRate,
      })
    } else if (data.type === SoundFont2SynthMessageType.GotPresetHeaders) {
      _presetHeaders = data.presetHeaders;
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

  getPresetHeaders(): Promise<PresetHeader[]> {
    _presetHeaders = undefined;
    this.port.postMessage({
      type: SoundFont2SynthMessageType.GetPresetHeaders
    })

    return new Promise(waitToGetPresetHeaders)
  }

  setProgram(channel: number, bank: number, preset: number) {
    this.port.postMessage({
      type: SoundFont2SynthMessageType.SetProgram,
      channel,
      bank,
      preset
    })
  }
}

const waitToGetPresetHeaders = (resolve: (value: (PromiseLike<any[]> | any[])) => void) => {
  if (_presetHeaders !== undefined) {
    const presetHeaders = _presetHeaders
    _presetHeaders = undefined
    resolve(presetHeaders)
  } else {
    setTimeout(waitToGetPresetHeaders.bind(this, resolve), 500)
  }
}
