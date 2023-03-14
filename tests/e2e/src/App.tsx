import { useCallback, useState, type FC } from 'react'
import {
  createSoundFont2SynthNode,
  type ISoundFont2SynthNode,
} from '../../../dist/sf2-synth-audio-worklet'
import { Button } from './Button'

const sf2URL = new URL('./assets/GeneralUser GS v1.471.sf2', import.meta.url)

const keys: Array<{ color: 'black' | 'white'; label: string; key: number }> = [
  { color: 'white', label: 'C', key: 60 },
  { color: 'black', label: 'C#', key: 61 },
  { color: 'white', label: 'D', key: 62 },
  { color: 'black', label: 'D#', key: 63 },
  { color: 'white', label: 'E', key: 64 },
  { color: 'white', label: 'F', key: 65 },
  { color: 'black', label: 'F#', key: 66 },
  { color: 'white', label: 'G', key: 67 },
  { color: 'black', label: 'G#', key: 68 },
  { color: 'white', label: 'A', key: 69 },
  { color: 'black', label: 'A#', key: 70 },
  { color: 'white', label: 'B', key: 71 },
  { color: 'white', label: 'C', key: 72 },
]

export const App: FC = () => {
  const [node, setNode] = useState<ISoundFont2SynthNode | undefined>(undefined)

  const start = useCallback(async () => {
    const audioContext = new AudioContext()
    const node = await createSoundFont2SynthNode(audioContext, sf2URL)
    node.connect(audioContext.destination)
    setNode(node)
  }, [])

  const playNote = useCallback(
    (key: number) => {
      node?.noteOn(0, key, 100, 0)
    },
    [node]
  )

  const stopNote = useCallback(
    (key: number) => {
      node?.noteOff(0, key, 0)
    },
    [node]
  )

  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-gray-800 space-y-12">
      <Button
        data-testid="start-button"
        width={816}
        disabled={!!node}
        onClick={start}
      >
        Start
      </Button>
      <div className="flex space-x-4">
        {keys.map(({ color, label, key }) => (
          <Button
            key={key}
            data-testid={`key-${key}-button`}
            width={48}
            color={color}
            disabled={!node}
            onMouseDown={() => {
              playNote(key)
            }}
            onMouseUp={() => {
              stopNote(key)
            }}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  )
}
