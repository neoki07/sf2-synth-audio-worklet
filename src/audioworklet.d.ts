interface IAudioWorkletProcessor {
  readonly port: MessagePort
}

declare let AudioWorkletProcessor: {
  prototype: IAudioWorkletProcessor
  new (): IAudioWorkletProcessor
}

interface AudioWorkletProcessorImpl extends IAudioWorkletProcessor {
  process: (
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ) => boolean
}

type AudioWorkletProcessorConstructor = new (
  options: any
) => AudioWorkletProcessorImpl

declare function registerProcessor(
  name: string,
  processorCtor: AudioWorkletProcessorConstructor
): void
