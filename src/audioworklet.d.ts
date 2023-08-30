interface AudioWorkletProcessor {
  readonly port: MessagePort
}

// eslint-disable-next-line @typescript-eslint/no-redeclare
declare let AudioWorkletProcessor: {
  prototype: AudioWorkletProcessor
  new (): AudioWorkletProcessor
}

interface AudioWorkletProcessorImpl extends AudioWorkletProcessor {
  process: (
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>,
  ) => boolean
}

type AudioWorkletProcessorConstructor = new (
  options: any,
) => AudioWorkletProcessorImpl

declare function registerProcessor(
  name: string,
  processorCtor: AudioWorkletProcessorConstructor,
): void
