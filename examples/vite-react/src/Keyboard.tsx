import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ISoundFont2SynthNode,
  createSoundFont2SynthNode,
} from 'sf2-synth-audio-worklet'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Piano, KeyboardShortcuts } from 'react-piano'
import {
  ArrowSmallLeftIcon,
  ArrowSmallDownIcon,
  ArrowSmallRightIcon,
  ArrowSmallUpIcon,
} from '@heroicons/react/24/solid'

import 'react-piano/dist/styles.css'
import './Keyboard.css'

const sf2URL = new URL('./assets/A320U.sf2', import.meta.url)

function SoundFontKeyboard() {
  const [node, setNode] = useState<ISoundFont2SynthNode | undefined>(undefined)
  const [octave, setOctave] = useState(2)
  const [velocity, setVelocity] = useState(100)
  const keyboardShortcuts = useMemo(
    () => [
      ...KeyboardShortcuts.create({
        firstNote: 12 * (octave + 2),
        lastNote: 12 * (octave + 2) + 16,
        keyboardConfig: KeyboardShortcuts.BOTTOM_ROW,
      }),
      ...KeyboardShortcuts.create({
        firstNote: 12 * (octave + 2) + 17,
        lastNote: 12 * (octave + 2) + 31,
        keyboardConfig: KeyboardShortcuts.QWERTY_ROW,
      }),
    ],
    [octave]
  )

  const playNote = useCallback(
    (midiNumber: number) => {
      if (node === undefined) return
      node.noteOn(0, midiNumber, velocity, 0)
    },
    [node, velocity]
  )

  const stopNote = useCallback(
    (midiNumber: number) => {
      if (node === undefined) return
      node.noteOff(0, midiNumber, 0)
    },
    [node]
  )

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Down': // IE/Edge specific value
        case 'ArrowDown':
          setVelocity((prev) => Math.max(0, prev - 1))
          break
        case 'Up': // IE/Edge specific value
        case 'ArrowUp':
          setVelocity((prev) => Math.min(127, prev + 1))
          break
        case 'Left': // IE/Edge specific value
        case 'ArrowLeft':
          setOctave((prev) => Math.max(-1, prev - 1))
          break
        case 'Right': // IE/Edge specific value
        case 'ArrowRight':
          setOctave((prev) => Math.min(5, prev + 1))
          break
        default:
          return
      }

      event.preventDefault()
    }

    if (node === undefined) return
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [node])

  if (node === undefined) {
    return (
      <button
        onClick={async () => {
          const audioContext = new AudioContext()
          const node = await createSoundFont2SynthNode(audioContext, sf2URL)
          node.connect(audioContext.destination)
          setNode(node)
        }}
      >
        Start
      </button>
    )
  }

  return (
    <div>
      <Piano
        noteRange={{ first: 12 * (octave + 2), last: 12 * (octave + 2) + 31 }}
        playNote={playNote}
        stopNote={stopNote}
        width={1000}
        keyboardShortcuts={keyboardShortcuts}
      />
      <div className="settings-container">
        <div>
          <h3>{`Octave: C${octave}`}</h3>
          <div className="keyboard-container">
            <button className="keyboard">
              <ArrowSmallLeftIcon color="#cccccc" />
            </button>
            <button className="keyboard">
              <ArrowSmallRightIcon color="#cccccc" />
            </button>
          </div>
        </div>
        <div className="velocity-container">
          <h3>{`Velocity: ${velocity}`}</h3>
          <div className="keyboard-container">
            <button className="keyboard">
              <ArrowSmallDownIcon color="#cccccc" />
            </button>
            <button className="keyboard">
              <ArrowSmallUpIcon color="#cccccc" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SoundFontKeyboard
