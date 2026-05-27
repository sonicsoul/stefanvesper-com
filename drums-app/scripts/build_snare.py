"""
Generate public/snare.wav.

The shipped snare is synthesised so this repo has no external sound
dependency. It combines two ingredients:

  1. A noise body (white noise pushed through a quick first-order
     highpass via differential) that gives the snare its "shhh".
  2. A tonal "ping" — a sine whose pitch decays from ~200 Hz to ~110 Hz,
     adding the characteristic snare body.

Replace public/snare.wav with any short 16-bit mono WAV to swap voices.
"""

import os
import wave

import numpy as np

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "snare.wav")
SAMPLE_RATE = 44100
DURATION = 0.18  # seconds


def main() -> None:
    t = np.linspace(0, DURATION, int(SAMPLE_RATE * DURATION), endpoint=False)

    np.random.seed(42)
    noise = np.random.randn(len(t))
    noise = np.diff(np.concatenate([[0.0], noise]))
    noise /= np.max(np.abs(noise))
    noise_env = np.exp(-t * 16)

    tone_freq = 200 * np.exp(-t * 28) + 110
    phase = np.cumsum(2 * np.pi * tone_freq / SAMPLE_RATE)
    tone = np.sin(phase)
    tone_env = np.exp(-t * 32)

    signal = noise * noise_env * 0.75 + tone * tone_env * 0.35
    signal = signal / np.max(np.abs(signal)) * 0.92
    signal_int = (signal * 32767).astype(np.int16)

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with wave.open(OUT, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(signal_int.tobytes())

    print(f"Wrote {OUT} ({os.path.getsize(OUT)} bytes)")


if __name__ == "__main__":
    main()
