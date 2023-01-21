;(function () {
  'use strict'

  const PROCESSOR_NAME = 'white-noise-processor'

  class WhiteNoiseProcessor extends AudioWorkletProcessor {
    process(_inputs, outputs) {
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
})()
//# sourceMappingURL=white-noise-processor.js.map
