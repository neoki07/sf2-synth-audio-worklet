export class SoundFont2SynthNode extends AudioWorkletNode {
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
    })
  }

  onprocessorerror = (err: Event) => {
    console.log(
      `An error from SoundFont2SynthProcessor.process() occurred: ${err}`
    )
  }

  onmessage(event: MessageEvent) {
    if (event.data.type === 'wasm-module-loaded') {
      this.port.postMessage({
        type: 'init-synth',
        sampleRate: this.context.sampleRate,
      })
    }
  }
}
