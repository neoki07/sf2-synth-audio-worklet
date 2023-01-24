import React, {ChangeEvent, ChangeEventHandler, Dispatch, FC, ReactNode, SetStateAction, useRef} from "react";
// @ts-ignore
import {MidiNumbers} from 'react-piano';
import {NoteRange} from "./App";


type AutoblurSelectProps = {
  className: string;
  onChange: ChangeEventHandler<HTMLSelectElement>;
  value: string | number;
  children: ReactNode;
}

const AutoblurSelect: FC<AutoblurSelectProps> = ({className, onChange, value, children}) => {
  const selectRef = useRef<HTMLSelectElement>(null);

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange(event);
    selectRef.current!.blur();
  }

  return (
    <select className={className} value={value} onChange={handleChange} ref={selectRef}>
      {children}
    </select>
  )

}

type LabelProps = {
  children: ReactNode
}

const Label: FC<LabelProps> = ({children}) => {
  return <small className="mb-1 text-muted">{children}</small>;
}

type PianoConfigProps = {
  noteRange: NoteRange;
  setNoteRange: Dispatch<SetStateAction<NoteRange>>;
  instrumentName: string;
  setInstrumentName: Dispatch<SetStateAction<string>>;
  instrumentList: string[];
}

export const PianoConfig: FC<PianoConfigProps> = ({
                                                    noteRange,
                                                    setNoteRange,
                                                    instrumentName,
                                                    setInstrumentName,
                                                    instrumentList
                                                  }) => {
  const midiNumbersToNotes = MidiNumbers.NATURAL_MIDI_NUMBERS.reduce((obj: any, midiNumber: any) => {
    obj[midiNumber] = MidiNumbers.getAttributes(midiNumber).note;
    return obj;
  }, {});

  const onChangeFirstNote = (event: ChangeEvent<HTMLSelectElement>) => {
    setNoteRange((prev) =>
      ({
        first: parseInt(event.target.value, 10),
        last: prev.last,
      })
    )
  };

  const onChangeLastNote = (event: ChangeEvent<HTMLSelectElement>) => {
    setNoteRange((prev) =>
      ({
        first: prev.first,
        last: parseInt(event.target.value, 10),
      })
    )
  };

  const onChangeInstrument = (event: ChangeEvent<HTMLSelectElement>) => {
    setInstrumentName(event.target.value);
  };

  return (
    <div className="form-row">
      <div className="col-3">
        <Label>First note</Label>
        <AutoblurSelect
          className="form-control"
          onChange={onChangeFirstNote}
          value={noteRange.first}
        >
          {MidiNumbers.NATURAL_MIDI_NUMBERS.map((midiNumber: number) => (
            <option value={midiNumber} disabled={midiNumber >= noteRange.last} key={midiNumber}>
              {midiNumbersToNotes[midiNumber]}
            </option>
          ))}
        </AutoblurSelect>
      </div>
      <div className="col-3">
        <Label>Last note</Label>
        <AutoblurSelect
          className="form-control"
          onChange={onChangeLastNote}
          value={noteRange.last}
        >
          {MidiNumbers.NATURAL_MIDI_NUMBERS.map((midiNumber: number) => (
            <option value={midiNumber} disabled={midiNumber <= noteRange.first} key={midiNumber}>
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
          {instrumentList.map((value) => (
            <option value={value} key={value}>
              {value}
            </option>
          ))}
        </AutoblurSelect>
      </div>
    </div>
  )
}