import { type Pattern, STEPS, VOICES } from "../types";

export function emptyPattern(): Pattern {
  return Array.from({ length: VOICES }, () => new Array(STEPS).fill(false));
}

export function clonePattern(p: Pattern): Pattern {
  return p.map((row) => [...row]);
}

/**
 * Encode a 4×16 pattern as 16 hex chars.
 *
 * Each column (step) is one nibble. Bit 0 = kick, bit 1 = snare,
 * bit 2 = hat, bit 3 = clap. The high-to-low byte order in the hex
 * string runs from step 0 to step 15, so the encoding is human-scannable.
 */
export function encodePattern(pattern: Pattern): string {
  let out = "";
  for (let step = 0; step < STEPS; step++) {
    let nibble = 0;
    for (let voice = 0; voice < VOICES; voice++) {
      if (pattern[voice]?.[step]) nibble |= 1 << voice;
    }
    out += nibble.toString(16);
  }
  return out;
}

export function decodePattern(hex: string): Pattern | null {
  if (hex.length !== STEPS) return null;
  if (!/^[0-9a-f]+$/i.test(hex)) return null;
  const pattern = emptyPattern();
  for (let step = 0; step < STEPS; step++) {
    const nibble = parseInt(hex[step], 16);
    for (let voice = 0; voice < VOICES; voice++) {
      pattern[voice][step] = (nibble & (1 << voice)) !== 0;
    }
  }
  return pattern;
}

export interface SharePayload {
  pattern: Pattern;
  bpm: number;
}

export function readFromHash(): SharePayload | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  const p = params.get("p");
  const bpmStr = params.get("bpm");
  if (!p) return null;
  const pattern = decodePattern(p);
  if (!pattern) return null;
  const bpm = bpmStr ? parseInt(bpmStr, 10) : 120;
  if (!Number.isFinite(bpm) || bpm < 40 || bpm > 240) return null;
  return { pattern, bpm };
}

export function writeToHash(payload: SharePayload): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams();
  params.set("p", encodePattern(payload.pattern));
  params.set("bpm", String(payload.bpm));
  // Use replaceState so the back button is not polluted by every step toggle
  history.replaceState(null, "", `#${params.toString()}`);
}
