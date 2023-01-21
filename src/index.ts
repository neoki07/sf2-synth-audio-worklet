import { PROCESSOR_NAME } from './constants'
// eslint-disable-next-line
// @ts-ignore
import processor from './generated/white-noise-processor.js?raw'

export { sum } from './sum'

const processorBlob = new Blob([processor], {
  type: 'application/javascript; charset=utf-8',
})

export async function createNode(audioContext: AudioContext) {
  const processorUrl = URL.createObjectURL(processorBlob)
  await audioContext.audioWorklet.addModule(processorUrl)
  return new AudioWorkletNode(audioContext, PROCESSOR_NAME)
}
