import { useCallback, useEffect, useRef, useState } from "react";
import { AudioEngine } from "../audio/engine";
import { PRESETS, DEFAULT_PRESET_INDEX } from "../audio/presets";
import {
  clonePattern,
  readFromHash,
  writeToHash,
} from "../utils/pattern";
import { type Pattern } from "../types";

const SNARE_URL = `${import.meta.env.BASE_URL}snare.wav`;

interface UseSequencerResult {
  isPlaying: boolean;
  bpm: number;
  pattern: Pattern;
  currentStep: number;
  isReady: boolean;
  togglePlay: () => Promise<void>;
  toggleStep: (voice: number, step: number) => void;
  setBpm: (bpm: number) => void;
  loadPreset: (index: number) => void;
  clearPattern: () => void;
  previewVoice: (voice: number) => Promise<void>;
  shareUrl: () => string;
}

export function useSequencer(): UseSequencerResult {
  const engineRef = useRef<AudioEngine | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpmState] = useState<number>(PRESETS[DEFAULT_PRESET_INDEX].bpm);
  const [pattern, setPattern] = useState<Pattern>(() => {
    const fromHash = readFromHash();
    if (fromHash) return fromHash.pattern;
    return clonePattern(PRESETS[DEFAULT_PRESET_INDEX].pattern);
  });
  const [currentStep, setCurrentStep] = useState(-1);

  // Apply BPM from URL hash on mount, if present
  useEffect(() => {
    const fromHash = readFromHash();
    if (fromHash) setBpmState(fromHash.bpm);
  }, []);

  // Lazily build the engine on first user gesture (browser autoplay policy)
  const ensureEngine = useCallback(async (): Promise<AudioEngine> => {
    if (engineRef.current) {
      await engineRef.current.resume();
      return engineRef.current;
    }
    const engine = new AudioEngine();
    await engine.init(SNARE_URL);
    engine.onStepAdvance = (step) => setCurrentStep(step);
    engineRef.current = engine;
    setIsReady(true);
    return engine;
  }, []);

  // Keep engine in sync with React state
  useEffect(() => {
    if (engineRef.current) engineRef.current.pattern = pattern;
  }, [pattern]);

  useEffect(() => {
    if (engineRef.current) engineRef.current.bpm = bpm;
  }, [bpm]);

  // Persist to URL hash whenever pattern or BPM changes
  useEffect(() => {
    writeToHash({ pattern, bpm });
  }, [pattern, bpm]);

  const togglePlay = useCallback(async () => {
    const engine = await ensureEngine();
    engine.pattern = pattern;
    engine.bpm = bpm;
    if (isPlaying) {
      engine.stop();
      setIsPlaying(false);
      setCurrentStep(-1);
    } else {
      engine.start();
      setIsPlaying(true);
    }
  }, [ensureEngine, isPlaying, pattern, bpm]);

  const toggleStep = useCallback((voice: number, step: number) => {
    setPattern((prev) => {
      const next = clonePattern(prev);
      next[voice][step] = !next[voice][step];
      return next;
    });
  }, []);

  const setBpm = useCallback((value: number) => {
    setBpmState(value);
  }, []);

  const loadPreset = useCallback((index: number) => {
    const preset = PRESETS[index];
    if (!preset) return;
    setPattern(clonePattern(preset.pattern));
    setBpmState(preset.bpm);
  }, []);

  const clearPattern = useCallback(() => {
    setPattern(() =>
      Array.from({ length: 4 }, () => new Array(16).fill(false)),
    );
  }, []);

  const previewVoice = useCallback(
    async (voice: number) => {
      const engine = await ensureEngine();
      engine.preview(voice as 0 | 1 | 2 | 3);
    },
    [ensureEngine],
  );

  const shareUrl = useCallback(() => {
    writeToHash({ pattern, bpm });
    return window.location.href;
  }, [pattern, bpm]);

  return {
    isPlaying,
    bpm,
    pattern,
    currentStep,
    isReady,
    togglePlay,
    toggleStep,
    setBpm,
    loadPreset,
    clearPattern,
    previewVoice,
    shareUrl,
  };
}
