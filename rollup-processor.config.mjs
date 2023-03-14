import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'

export default [
  {
    input: 'src/processor.ts',
    output: {
      name: 'whiteNoiseProcessor',
      file: 'src/generated/processor.js',
      format: 'iife',
      sourcemap: true,
    },
    plugins: [typescript(), terser()],
  },
]
