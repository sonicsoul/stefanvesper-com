import { type Pattern } from "../types";

interface Preset {
  name: string;
  bpm: number;
  pattern: Pattern;
}

/** 1 = hit, 0 = rest. Four rows: kick, snare, hat, clap. */
function fromGrid(grid: string[]): Pattern {
  return grid.map((row) => row.split("").map((c) => c === "1"));
}

export const PRESETS: Preset[] = [
  {
    name: "Boom Tschack",
    bpm: 92,
    pattern: fromGrid([
      "1000000010000000", // kick
      "0000100000001000", // snare
      "1010101010101010", // hat
      "0000000000000000", // clap
    ]),
  },
  {
    name: "4-on-the-Floor",
    bpm: 124,
    pattern: fromGrid([
      "1000100010001000", // kick
      "0000000000000000", // snare
      "0010001000100010", // hat (offbeat 16ths)
      "0000100000001000", // clap on 2 & 4
    ]),
  },
  {
    name: "Full-on",
    bpm: 138,
    pattern: fromGrid([
      "1010101010101010", // kick — driving EBM 8ths
      "0000100000001000", // snare on 2 & 4
      "0101010101010101", // hat off the kick
      "0000000010000000", // sparse clap accent
    ]),
  },
];

export const DEFAULT_PRESET_INDEX = 1;
