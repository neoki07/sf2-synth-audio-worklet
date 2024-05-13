# sf2-synth-audio-worklet

[![license](https://img.shields.io/npm/l/sf2-synth-audio-worklet.svg)](https://github.com/neokidev/sf2-synth-audio-worklet/blob/main/LICENSE.md)
[![npm](https://img.shields.io/npm/v/sf2-synth-audio-worklet.svg)](https://www.npmjs.com/package/sf2-synth-audio-worklet)
[![npm downloads](https://img.shields.io/npm/dm/sf2-synth-audio-worklet)](https://www.npmjs.com/package/sf2-synth-audio-worklet)
[![ci](https://github.com/neokidev/sf2-synth-audio-worklet/actions/workflows/ci.yml/badge.svg)](https://github.com/neokidev/sf2-synth-audio-worklet/actions/workflows/ci.yml)

An Audio Worklet-based SoundFont2 synthesizer for the browser.

## Installation

```bash
npm install sf2-synth-audio-worklet
```

## Getting Started

This code sets up a simple SoundFont2 player in React using the library.

```tsx
import { useState } from 'react'
import {
  createSoundFont2SynthNode,
  type SoundFont2SynthNode,
} from 'sf2-synth-audio-worklet'

function App() {
  const [node, setNode] = useState<SoundFont2SynthNode>()

  const setup = async () => {
    const audioContext = new AudioContext()
    const sf2Url = 'path/to/soundfont2' // Replace with the SoundFont2 file path
    const node = await createSoundFont2SynthNode(audioContext, sf2Url)
    node.connect(audioContext.destination)
    setNode(node)
  }

  const noteOn = () => node?.noteOn(0, 60, 100, 0)
  const noteOff = () => node?.noteOff(0, 60, 0)

  return (
    <div>
      <button onClick={setup} disabled={!!node}>
        Setup
      </button>
      <button onMouseDown={noteOn} onMouseUp={noteOff} disabled={!node}>
        Sound
      </button>
    </div>
  )
}
```

## License

MIT
