# sf2-synth-audio-worklet

[![license](https://img.shields.io/npm/l/sf2-synth-audio-worklet.svg)](https://github.com/resonance-box/sf2-synth-audio-worklet/blob/main/LICENSE.md)
[![npm](https://img.shields.io/npm/v/sf2-synth-audio-worklet.svg)](https://www.npmjs.com/package/sf2-synth-audio-worklet)
[![npm downloads](https://img.shields.io/npm/dm/sf2-synth-audio-worklet)](https://www.npmjs.com/package/sf2-synth-audio-worklet)
[![ci](https://github.com/resonance-box/sf2-synth-audio-worklet/actions/workflows/ci.yml/badge.svg)](https://github.com/resonance-box/sf2-synth-audio-worklet/actions/workflows/ci.yml)

An Audio Worklet-based SoundFont2 synthesizer for the browser

## Installing

Install the library with npm or yarn or pnpm.

```bash
npm install sf2-synth-audio-worklet
```

```bash
yarn add sf2-synth-audio-worklet
```

```bash
pnpm add sf2-synth-audio-worklet
```

## Getting Started

This code sets up a simple SoundFont2 player in React using the library.

```tsx
import { useState } from 'react'
import {
  createSoundFont2SynthNode,
  SoundFont2SynthNode,
} from 'sf2-synth-audio-worklet'

export default function App() {
  const [started, setStarted] = useState(false)
  const [node, setNode] = useState<SoundFont2SynthNode>()

  function setup() {
    setStarted(true)
    const audioContext = new AudioContext()
    const url = 'path/to/soundfont2' // Replace with the SoundFont2 file path
    createSoundFont2SynthNode(audioContext, url).then((node) => {
      node.connect(audioContext.destination)
      setNode(node)
    })
  }

  function noteOn() {
    node?.noteOn(0, 60, 100, 0)
  }

  function noteOff() {
    node?.noteOff(0, 60, 0)
  }

  return (
    <div>
      <button disabled={started} onClick={setup}>
        Start
      </button>
      <button
        disabled={node === undefined}
        onMouseDown={noteOn}
        onMouseUp={noteOff}
      >
        Play
      </button>
    </div>
  )
}
```

## License

MIT
