import React, {
  ChangeEvent,
  ChangeEventHandler,
  Dispatch,
  FC,
  ReactNode,
  SetStateAction,
  useRef,
} from 'react'
// @ts-ignore
import { MidiNumbers } from 'react-piano'
import { NoteRange } from './App'
import { PresetHeader } from '../../../dist/sf2-synth-audio-worklet'

type AutoblurSelectProps = {
  className: string
  onChange: ChangeEventHandler<HTMLSelectElement>
  value: string | number
  children: ReactNode
}

const AutoblurSelect: FC<AutoblurSelectProps> = ({
  className,
  onChange,
  value,
  children,
}) => {
  const selectRef = useRef<HTMLSelectElement>(null)

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange(event)
    selectRef.current!.blur()
  }

  return (
    <select
      className={className}
      value={value}
      onChange={handleChange}
      ref={selectRef}
    >
      {children}
    </select>
  )
}

type LabelProps = {
  children: ReactNode
}

const Label: FC<LabelProps> = ({ children }) => {
  return <small className="mb-1 text-muted">{children}</small>
}

type PianoConfigProps = {
  noteRange: NoteRange
  instrumentName: string
  presetHeaders: PresetHeader[]
  onChangeFirstNote: (event: ChangeEvent<HTMLSelectElement>) => void
  onChangeLastNote: (event: ChangeEvent<HTMLSelectElement>) => void
  onChangeInstrument: (event: ChangeEvent<HTMLSelectElement>) => void
}

export const PianoConfig: FC<PianoConfigProps> = ({
  noteRange,
  instrumentName,
  presetHeaders,
  onChangeFirstNote,
  onChangeLastNote,
  onChangeInstrument,
}) => {
  const midiNumbersToNotes = MidiNumbers.NATURAL_MIDI_NUMBERS.reduce(
    (obj: any, midiNumber: any) => {
      obj[midiNumber] = MidiNumbers.getAttributes(midiNumber).note
      return obj
    },
    {}
  )

  return (
    <div className="form-row">
      <div className="col-3">
        <Label>First note</Label>
        <AutoblurSelect
          className="form-control"
          value={noteRange.first}
          onChange={onChangeFirstNote}
        >
          {MidiNumbers.NATURAL_MIDI_NUMBERS.map((midiNumber: number) => (
            <option
              value={midiNumber}
              disabled={midiNumber >= noteRange.last}
              key={midiNumber}
            >
              {midiNumbersToNotes[midiNumber]}
            </option>
          ))}
        </AutoblurSelect>
      </div>
      <div className="col-3">
        <Label>Last note</Label>
        <AutoblurSelect
          className="form-control"
          value={noteRange.last}
          onChange={onChangeLastNote}
        >
          {MidiNumbers.NATURAL_MIDI_NUMBERS.map((midiNumber: number) => (
            <option
              value={midiNumber}
              disabled={midiNumber <= noteRange.first}
              key={midiNumber}
            >
              {midiNumbersToNotes[midiNumber]}
            </option>
          ))}
        </AutoblurSelect>
      </div>
      <div className="col-6">
        <Label>Instrument</Label>
        <AutoblurSelect
          className="form-control"
          value={instrumentName}
          onChange={onChangeInstrument}
        >
          {presetHeaders.map((header, index) => (
            <option key={header.name} value={index}>
              {`${index}: ${header.name}`}
            </option>
          ))}
        </AutoblurSelect>
      </div>
    </div>
  )
}
