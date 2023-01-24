import {useCallback, useState} from 'react'
// @ts-ignore
import {Piano, KeyboardShortcuts, MidiNumbers} from 'react-piano';
import {createSoundFont2SynthNode, ISoundFont2SynthNode} from "../../../dist/sf2-synth-audio-worklet";
import 'react-piano/dist/styles.css';
import {PianoConfig} from "./PianoConfig";

const sf2URL = new URL('./assets/A320U.sf2', import.meta.url)

export type NoteRange = {
  first: number;
  last: number;
}

function App() {
  const [node, setNode] = useState<ISoundFont2SynthNode | undefined>(undefined)

  const [instrumentName, setInstrumentName] = useState('acoustic_grand_piano');
  const [instrumentList, setInstrumentList] = useState(['acoustic_grand_piano', 'acoustic_grand_piano2', 'acoustic_grand_piano3']);
  const [noteRange, setNoteRange] = useState<NoteRange>({
    first: MidiNumbers.fromNote('c3'),
    last: MidiNumbers.fromNote('f5'),
  })

  const keyboardShortcuts = KeyboardShortcuts.create({
    firstNote: noteRange.first,
    lastNote: noteRange.last,
    keyboardConfig: KeyboardShortcuts.HOME_ROW,
  });

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
    <div className="text-gray-700 flex min-h-screen flex-col items-center justify-center font-mono text-sm bg-lime-300">
      <h1 className='text-4xl font-bold'>Soundfont2 Synth Audio Worklet Demo</h1>
      <div className="">
        <Piano
          noteRange={noteRange}
          keyboardShortcuts={keyboardShortcuts}
          playNote={playNote}
          stopNote={stopNote}
          // disabled={isLoading}
          // width={containerWidth}
          width={800}
        />
        <PianoConfig noteRange={noteRange} setNoteRange={setNoteRange} instrumentName={instrumentName}
                     setInstrumentName={setInstrumentName} instrumentList={instrumentList}/>
      </div>
    </div>
  )
}

export default App
