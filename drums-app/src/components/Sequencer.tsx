import { memo } from "react";
import {
  VOICE_ORDER,
  VOICE_LABELS,
  VOICE_HINTS,
  STEPS,
  type Pattern,
} from "../types";

interface SequencerProps {
  pattern: Pattern;
  currentStep: number;
  onToggleStep: (voice: number, step: number) => void;
  onPreviewVoice: (voice: number) => void;
}

const Sequencer = memo(function Sequencer({
  pattern,
  currentStep,
  onToggleStep,
  onPreviewVoice,
}: SequencerProps) {
  return (
    <div className="grid" role="grid" aria-label="Drum pattern">
      {VOICE_ORDER.map((voice, voiceIndex) => (
        <div className="row" role="row" key={voice}>
          <button
            type="button"
            className="voiceLabel"
            onClick={() => onPreviewVoice(voiceIndex)}
            aria-label={`Preview ${VOICE_LABELS[voice]}`}
            title={VOICE_HINTS[voice]}
          >
            <span className="voiceLabel__name">{VOICE_LABELS[voice]}</span>
            <span className="voiceLabel__hint">{VOICE_HINTS[voice]}</span>
          </button>
          <div className="steps">
            {Array.from({ length: STEPS }).map((_, step) => {
              const active = pattern[voiceIndex]?.[step] ?? false;
              const playing = currentStep === step;
              const beatStart = step % 4 === 0;
              const cls = [
                "step",
                active && "step--active",
                playing && "step--playing",
                beatStart && "step--beatStart",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <button
                  type="button"
                  key={step}
                  className={cls}
                  onClick={() => onToggleStep(voiceIndex, step)}
                  aria-pressed={active}
                  aria-label={`${VOICE_LABELS[voice]} step ${step + 1}`}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
});

export default Sequencer;
