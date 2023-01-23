import typescript from '@rollup/plugin-typescript'
import { terser } from 'rollup-plugin-terser'

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
