import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react'
// @ts-ignore
import { Piano, KeyboardShortcuts, MidiNumbers } from 'react-piano'
import {
  createSoundFont2SynthNode,
  ISoundFont2SynthNode,
  PresetHeader,
} from '../../../dist/sf2-synth-audio-worklet'
import 'react-piano/dist/styles.css'
import { PianoConfig } from './PianoConfig'
import { Layout } from './Layout'

const sf2URL = new URL('./assets/A320U.sf2', import.meta.url)

export type NoteRange = {
  first: number
  last: number
}

function App() {
  const [node, setNode] = useState<ISoundFont2SynthNode | undefined>(undefined)

  const [instrumentName, setInstrumentName] = useState('acoustic_grand_piano')

  const [noteRange, setNoteRange] = useState<NoteRange>({
    first: MidiNumbers.fromNote('c3'),
    last: MidiNumbers.fromNote('f5'),
  })

  const [presetHeaders, setPresetHeaders] = useState<
    PresetHeader[] | undefined
  >(undefined)
  const [selectedPresetHeaderIndex, setSelectedPresetHeaderIndex] = useState(0)
  const instrumentNames = useMemo(
    () => presetHeaders?.map((header) => header.name),
    [presetHeaders]
  )

  const keyboardShortcuts = KeyboardShortcuts.create({
    firstNote: noteRange.first,
    lastNote: noteRange.last,
    keyboardConfig: KeyboardShortcuts.HOME_ROW,
  })

  const playNote = useCallback(
    (midiNumber: number) => {
      if (node === undefined) return
      node.noteOn(0, midiNumber, 100, 0)
    },
    [node]
  )

  const stopNote = useCallback(
    (midiNumber: number) => {
      if (node === undefined) return
      node.noteOff(0, midiNumber, 0)
    },
    [node]
  )

  const onChangeFirstNote = (event: ChangeEvent<HTMLSelectElement>) => {
    setNoteRange((prev) => ({
      first: parseInt(event.target.value, 10),
      last: prev.last,
    }))
  }

  const onChangeLastNote = (event: ChangeEvent<HTMLSelectElement>) => {
    setNoteRange((prev) => ({
      first: prev.first,
      last: parseInt(event.target.value, 10),
    }))
  }

  const onChangeInstrument = (event: ChangeEvent<HTMLSelectElement>) => {
    setInstrumentName(event.target.value)
    setSelectedPresetHeaderIndex(Number(event.target.value))
  }

  useEffect(() => {
    if (node === undefined) return
    ;(async () => {
      setPresetHeaders(await node.getPresetHeaders())
    })()
  }, [node])

  useEffect(() => {
    if (node === undefined || presetHeaders === undefined) return

    const { bank, preset } = presetHeaders[selectedPresetHeaderIndex]
    node.setProgram(0, bank, preset)
  }, [selectedPresetHeaderIndex])

  if (node === undefined) {
    return (
      <Layout>
        <button
          className="p-2 px-4 bg-blue-500 rounded-lg text-white"
          onClick={async () => {
            const audioContext = new AudioContext()
            const node = await createSoundFont2SynthNode(audioContext, sf2URL)
            node.connect(audioContext.destination)
            setNode(node)
          }}
        >
          START
        </button>
      </Layout>
    )
  }

  return (
    <Layout>
      <div>
        <Piano
          noteRange={noteRange}
          keyboardShortcuts={keyboardShortcuts}
          playNote={playNote}
          stopNote={stopNote}
          width={800}
        />
      </div>
      {instrumentNames && (
        <PianoConfig
          noteRange={noteRange}
          instrumentName={instrumentName}
          presetHeaders={presetHeaders!}
          onChangeFirstNote={onChangeFirstNote}
          onChangeLastNote={onChangeLastNote}
          onChangeInstrument={onChangeInstrument}
        />
      )}
    </Layout>
  )
}

export default App
