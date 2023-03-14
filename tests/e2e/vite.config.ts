import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/sf2-synth-audio-worklet/',
  plugins: [react()],
  server: {
    fs: {
      allow: ['src', '../../dist'],
    },
  },
})
