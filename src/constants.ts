export const PROCESSOR_NAME = 'sf2-synth-processor'

export const SoundFont2SynthMessageType = {
  SendWasmModule: 'send-wasm-module',
  WasmModuleLoaded: 'wasm-module-loaded',
  InitSynth: 'init-synth',
  NoteOn: 'note-on',
  NoteOff: 'note-off',
} as const

export type SoundFont2SynthMessageType =
  (typeof SoundFont2SynthMessageType)[keyof typeof SoundFont2SynthMessageType]
