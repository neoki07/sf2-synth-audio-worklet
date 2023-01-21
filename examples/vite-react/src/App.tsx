import { useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'
import { createNode } from 'sf2-synth-audio-worklet'

function App() {
  const [node, setNode] = useState<AudioWorkletNode | undefined>(undefined)

  return (
    <div className="App">
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" className="logo" alt="Vite logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React + Audio Worklet</h1>
      <h1>Demo</h1>
      <div className="card">
        <button
          disabled={node !== undefined}
          onClick={async () => {
            const audioContext = new AudioContext()
            const node = await createNode(audioContext)
            node.connect(audioContext.destination)
            setNode(node)
          }}
        >
          start
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </div>
  )
}

export default App
