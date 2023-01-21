import { PROCESSOR_NAME } from './constants'

class WhiteNoiseProcessor extends AudioWorkletProcessor {
  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const output = outputs[0]
    output.forEach((channel) => {
      for (let i = 0; i < channel.length; i++) {
        channel[i] = Math.random() * 2 - 1
      }
    })
    return true
  }
}

registerProcessor(PROCESSOR_NAME, WhiteNoiseProcessor)
