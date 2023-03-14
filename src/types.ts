export interface PresetHeader {
  name: string
  bag_id: number
  bank: number
  genre: number
  library: number
  morphology: number
  preset: number
}

export type SoundFont2SynthNodeMessageData =
  | {
      type: 'wasm-module-loaded'
    }
  | {
      type: 'got-preset-headers'
      presetHeaders: PresetHeader[]
    }

export type SoundFont2SynthProcessorMessageData =
  | {
      type: 'send-wasm-module'
      wasmBytes: ArrayBuffer
      sf2Bytes: ArrayBuffer
    }
  | {
      type: 'init-synth'
      sampleRate: number
    }
  | {
      type: 'note-on'
      channel: number
      key: number
      vel: number
      delayTime?: number
    }
  | {
      type: 'note-off'
      channel: number
      key: number
      delayTime?: number
    }
  | {
      type: 'get-preset-headers'
    }
  | {
      type: 'set-program'
      channel: number
      bank: number
      preset: number
    }
