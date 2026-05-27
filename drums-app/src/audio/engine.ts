/**
 * The audio engine.
 *
 * Uses the lookahead-scheduler pattern (Chris Wilson, "A Tale of Two Clocks"):
 *
 *   - A setInterval ticks every `lookahead` ms.
 *   - On each tick we look up to `scheduleAheadTime` seconds into the future
 *     and schedule all steps that fall in that window.
 *   - Each note is scheduled with sample-accurate Web Audio time, so the
 *     audio thread plays it exactly on time even if JS is jittery.
 *   - A separate requestAnimationFrame loop polls AudioContext.currentTime
 *     and reports the most recently-played step back to React via a callback.
 *
 * This is exactly the pattern professional in-browser audio (Ableton-style
 * step sequencers, Soundtrap, Splice's web tools, etc.) uses.
 */

import {
  createKick,
  createHat,
  createClap,
  createSnareSampler,
  type Voice,
  type SampleVoice,
} from "./voices";
import { type Pattern, STEPS } from "../types";

interface ScheduledStep {
  step: number;
  time: number;
}

export class AudioEngine {
  private ctx: AudioContext;
  private master: GainNode;

  private kick: Voice;
  private snare: SampleVoice;
  private hat: Voice;
  private clap: Voice;

  /* state mutated by the React layer */
  pattern: Pattern = Array.from({ length: 4 }, () =>
    new Array(STEPS).fill(false),
  );
  bpm = 120;

  /* internal scheduler state */
  private isRunning = false;
  private currentStep = 0;
  private nextStepTime = 0;
  private schedulerHandle: number | null = null;
  private visualHandle: number | null = null;

  /* future steps already scheduled for audio; the visual loop pops them
     once AudioContext.currentTime catches up. */
  private scheduledQueue: ScheduledStep[] = [];

  /* tuning */
  private readonly lookaheadMs = 25;
  private readonly scheduleAheadTime = 0.1; // seconds

  /* subscribers */
  onStepAdvance: ((step: number) => void) | null = null;

  constructor() {
    const AudioContextCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    this.ctx = new AudioContextCtor();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.85;
    this.master.connect(this.ctx.destination);

    this.kick = createKick(this.ctx, this.master);
    this.hat = createHat(this.ctx, this.master);
    this.clap = createClap(this.ctx, this.master);
    this.snare = createSnareSampler(this.ctx, this.master);
  }

  async init(snareUrl: string): Promise<void> {
    if (this.ctx.state === "suspended") await this.ctx.resume();
    await this.snare.load(snareUrl);
  }

  async resume(): Promise<void> {
    if (this.ctx.state === "suspended") await this.ctx.resume();
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.currentStep = 0;
    this.nextStepTime = this.ctx.currentTime + 0.06;
    this.scheduledQueue = [];
    this.tick();
    this.schedulerHandle = window.setInterval(
      () => this.tick(),
      this.lookaheadMs,
    );
    this.visualHandle = requestAnimationFrame(() => this.visualLoop());
  }

  stop(): void {
    this.isRunning = false;
    if (this.schedulerHandle !== null) {
      clearInterval(this.schedulerHandle);
      this.schedulerHandle = null;
    }
    if (this.visualHandle !== null) {
      cancelAnimationFrame(this.visualHandle);
      this.visualHandle = null;
    }
    this.scheduledQueue = [];
    this.onStepAdvance?.(-1);
  }

  private tick(): void {
    while (
      this.nextStepTime <
      this.ctx.currentTime + this.scheduleAheadTime
    ) {
      this.scheduleStep(this.currentStep, this.nextStepTime);
      this.scheduledQueue.push({
        step: this.currentStep,
        time: this.nextStepTime,
      });
      this.advanceStep();
    }
  }

  private scheduleStep(step: number, time: number): void {
    if (this.pattern[0]?.[step]) this.kick.trigger(time);
    if (this.pattern[1]?.[step]) this.snare.trigger(time);
    if (this.pattern[2]?.[step]) this.hat.trigger(time);
    if (this.pattern[3]?.[step]) this.clap.trigger(time);
  }

  private advanceStep(): void {
    const secondsPerBeat = 60 / this.bpm;
    const secondsPerStep = secondsPerBeat / 4; // 16th notes
    this.nextStepTime += secondsPerStep;
    this.currentStep = (this.currentStep + 1) % STEPS;
  }

  private visualLoop(): void {
    if (!this.isRunning) return;
    const now = this.ctx.currentTime;
    // Pop and report any steps whose scheduled time has arrived.
    while (
      this.scheduledQueue.length > 0 &&
      this.scheduledQueue[0].time <= now
    ) {
      const { step } = this.scheduledQueue.shift()!;
      this.onStepAdvance?.(step);
    }
    this.visualHandle = requestAnimationFrame(() => this.visualLoop());
  }

  /** Preview a single voice without affecting transport. */
  preview(voiceIndex: 0 | 1 | 2 | 3): void {
    const now = this.ctx.currentTime + 0.001;
    if (voiceIndex === 0) this.kick.trigger(now);
    else if (voiceIndex === 1) this.snare.trigger(now);
    else if (voiceIndex === 2) this.hat.trigger(now);
    else if (voiceIndex === 3) this.clap.trigger(now);
  }
}
