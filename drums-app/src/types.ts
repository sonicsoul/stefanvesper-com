/** A pattern is a fixed-size matrix: rows are voices, columns are steps. */
export type Pattern = boolean[][];

export type VoiceKey = "kick" | "snare" | "hat" | "clap";

export const VOICE_ORDER: VoiceKey[] = ["kick", "snare", "hat", "clap"];

export const STEPS = 16;
export const VOICES = VOICE_ORDER.length;

export const VOICE_LABELS: Record<VoiceKey, string> = {
  kick: "KICK",
  snare: "SNARE",
  hat: "HIHAT",
  clap: "CLAP",
};

export const VOICE_HINTS: Record<VoiceKey, string> = {
  kick: "Synth — sine sweep 150→50 Hz",
  snare: "Sample — synthesised WAV",
  hat: "Synth — filtered white noise",
  clap: "Synth — burst stack",
};
