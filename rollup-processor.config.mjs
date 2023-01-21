import typescript from '@rollup/plugin-typescript'

export default [
  {
    input: 'src/white-noise-processor.ts',
    output: {
      name: 'whiteNoiseProcessor',
      file: 'src/generated/white-noise-processor.js',
      format: 'iife',
      sourcemap: true,
    },
    plugins: [typescript()],
  },
]
