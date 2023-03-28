import { PROCESSOR_NAME } from './constants'
// eslint-disable-next-line
// @ts-ignore
import processorRaw from './generated/processor.js?raw'
// eslint-disable-next-line
// @ts-ignore
import wasmURL from './generated/wasm/sf2_synth_audio_worklet_wasm_bg.wasm?url'
import { SoundFont2SynthNodeImpl, type SoundFont2SynthNode } from './node'
import { type PresetHeader } from './types'

const processorBlob = new Blob([processorRaw], {
  type: 'application/javascript; charset=utf-8',
})

async function createSoundFont2SynthNode(
  context: AudioContext,
  sf2URL: string | URL
): Promise<SoundFont2SynthNode> {
  let node

  try {
    // Fetch the WebAssembly module that performs pitch detection.
    const response = await window.fetch(wasmURL)
    const wasmBytes = await response.arrayBuffer()

    // Add our audio processor worklet to the context.
    try {
      const processorUrl = URL.createObjectURL(processorBlob)
      await context.audioWorklet.addModule(processorUrl)
    } catch (err) {
      let errorMessage = 'Failed to load sf2 synth worklet. '

      if (err instanceof Error) {
        errorMessage += `Further info: ${err.message}`
      } else {
        errorMessage += 'Unexpected error'
      }

      throw new Error(errorMessage)
    }

    // Create the AudioWorkletNode which enables the main JavaScript thread to
    // communicate with the audio processor (which runs in a Worklet).
    node = new SoundFont2SynthNodeImpl(context, PROCESSOR_NAME)

    const sf2Response = await fetch(sf2URL)
    const sf2Bytes = await sf2Response.arrayBuffer()

    // Send the Wasm module to the audio node which in turn passes it to the
    // processor running in the Worklet thread. Also, pass any configuration
    // parameters for the Wasm detection algorithm.
    node.init(wasmBytes, sf2Bytes)
  } catch (err) {
    let errorMessage = 'Failed to load audio analyzer WASM module. '

    if (err instanceof Error) {
      errorMessage += `Further info: ${err.message}`
    } else {
      errorMessage += 'Unexpected error'
    }

    throw new Error(errorMessage)
  }

  return node
}

export { type SoundFont2SynthNode, createSoundFont2SynthNode }
export type { PresetHeader }
