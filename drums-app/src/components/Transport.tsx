import { useState } from "react";

interface TransportProps {
  isPlaying: boolean;
  bpm: number;
  onTogglePlay: () => void;
  onBpmChange: (bpm: number) => void;
  onClear: () => void;
  onShare: () => string;
}

export default function Transport({
  isPlaying,
  bpm,
  onTogglePlay,
  onBpmChange,
  onClear,
  onShare,
}: TransportProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = onShare();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard might be unavailable; fall back to a prompt-style hint
      window.prompt("Copy this URL", url);
    }
  };

  return (
    <div className="transport">
      <button
        type="button"
        className={`btn btn--play ${isPlaying ? "btn--playing" : ""}`}
        onClick={onTogglePlay}
        aria-pressed={isPlaying}
      >
        <span className="btn--play__icon" aria-hidden="true">
          {isPlaying ? "■" : "▶"}
        </span>
        <span>{isPlaying ? "STOP" : "PLAY"}</span>
      </button>

      <div className="bpm">
        <label className="bpm__label" htmlFor="bpm">
          BPM
        </label>
        <input
          id="bpm"
          className="bpm__slider"
          type="range"
          min={60}
          max={200}
          value={bpm}
          onChange={(e) => onBpmChange(parseInt(e.target.value, 10))}
        />
        <span className="bpm__value">{bpm}</span>
      </div>

      <div className="transport__actions">
        <button type="button" className="btn btn--ghost" onClick={onClear}>
          CLEAR
        </button>
        <button type="button" className="btn btn--ghost" onClick={handleShare}>
          {copied ? "COPIED ✓" : "SHARE"}
        </button>
      </div>
    </div>
  );
}
