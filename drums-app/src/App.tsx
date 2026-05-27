import { useEffect } from "react";
import Sequencer from "./components/Sequencer";
import Transport from "./components/Transport";
import PresetBar from "./components/PresetBar";
import { useSequencer } from "./hooks/useSequencer";

export default function App() {
  const {
    isPlaying,
    bpm,
    pattern,
    currentStep,
    togglePlay,
    toggleStep,
    setBpm,
    loadPreset,
    clearPattern,
    previewVoice,
    shareUrl,
  } = useSequencer();

  // Spacebar toggles play/stop. Keep it lightweight — no preventDefault unless
  // we actually want to handle the key (avoid hijacking inputs).
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [togglePlay]);

  return (
    <div className="app">
      <header className="header">
        <div className="header__brand">
          <div className="header__name">STEP-808</div>
          <div className="header__sub">Drum Sequencer</div>
        </div>
        <div className="header__meta">
          <span className="led led--on" aria-hidden="true" />
          <span className="header__byline">by Stefan Vesper</span>
        </div>
      </header>

      <main className="panel">
        <Sequencer
          pattern={pattern}
          currentStep={currentStep}
          onToggleStep={toggleStep}
          onPreviewVoice={previewVoice}
        />

        <div className="controls">
          <Transport
            isPlaying={isPlaying}
            bpm={bpm}
            onTogglePlay={togglePlay}
            onBpmChange={setBpm}
            onClear={clearPattern}
            onShare={shareUrl}
          />
          <PresetBar onLoadPreset={loadPreset} />
        </div>
      </main>

      <footer className="footer">
        <span>React · TypeScript · Web Audio API</span>
        <span className="footer__hint">
          Click steps to program · Space to play/stop · Click voice labels to preview
        </span>
      </footer>
    </div>
  );
}
