"use client";


import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type RenderArgs = {
  isSpinning: boolean;
  spinClassName: string;
};

export type EasterEggSpinWrapperProps = {
  className?: string;
  style?: React.CSSProperties;
  /** Called when the user clicks fewer than `pressTarget` times (after the click burst ends). */
  onNormalClick?: () => void;
  /** Defaults to 7. */
  pressTarget?: number;
  /**
   * How long we wait after the last click before deciding
   * the click burst is \"done\" and firing `onNormalClick`.
   */
  pressFinalizeDelayMs?: number;
  /** Spin animation duration (should match CSS). */
  spinDurationMs?: number;
  children: (args: RenderArgs) => React.ReactNode;
};

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx =
    window.AudioContext ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
    sharedAudioCtx = new AudioCtx();
  }
  return sharedAudioCtx;
}

function playSpinSound(durationMs: number): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Autoplay policies: we are called from a click, so resume should succeed.
  void ctx.resume().catch(() => {});

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sawtooth";
  osc.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;
  const duration = Math.max(0.1, durationMs / 1000);

  // Frequency ramps up (acceleration) then down (deceleration)
  osc.frequency.setValueAtTime(90, now);
  osc.frequency.exponentialRampToValueAtTime(750, now + duration * 0.55);
  osc.frequency.exponentialRampToValueAtTime(140, now + duration);

  // Gentle volume envelope
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.04, now + 0.12);
  gain.gain.linearRampToValueAtTime(0.07, now + duration * 0.55);
  gain.gain.linearRampToValueAtTime(0.0001, now + duration);

  osc.start(now);
  osc.stop(now + duration);

  osc.onended = () => {
    try {
      osc.disconnect();
      gain.disconnect();
    } catch {
      // ignore
    }
  };
}

export function EasterEggSpinWrapper({
  className,
  style,
  children,
  onNormalClick,
  pressTarget = 7,
  pressFinalizeDelayMs = 350,
  spinDurationMs = 2600,
}: EasterEggSpinWrapperProps) {
  const pressCountRef = useRef(0);
  const finalizeTimerRef = useRef<number | null>(null);
  const spinTimerRef = useRef<number | null>(null);

  const [spinRunId, setSpinRunId] = useState(0);

  const isSpinning = spinRunId !== 0;

  useEffect(() => {
    return () => {
      if (finalizeTimerRef.current) window.clearTimeout(finalizeTimerRef.current);
      if (spinTimerRef.current) window.clearTimeout(spinTimerRef.current);
    };
  }, []);

  const triggerSpin = () => {
    // Reset click burst state
    pressCountRef.current = 0;
    if (finalizeTimerRef.current) window.clearTimeout(finalizeTimerRef.current);
    finalizeTimerRef.current = null;

    const runId = Date.now();
    setSpinRunId(runId);
    playSpinSound(spinDurationMs);

    if (spinTimerRef.current) window.clearTimeout(spinTimerRef.current);
    spinTimerRef.current = window.setTimeout(() => {
      setSpinRunId((current) => (current === runId ? 0 : current));
    }, spinDurationMs);
  };

  const handleClick = () => {
    if (isSpinning) return;

    pressCountRef.current += 1;

    if (pressCountRef.current >= pressTarget) {
      triggerSpin();
      return;
    }

    if (finalizeTimerRef.current) window.clearTimeout(finalizeTimerRef.current);
    finalizeTimerRef.current = window.setTimeout(() => {
      pressCountRef.current = 0;
      onNormalClick?.();
    }, pressFinalizeDelayMs);
  };

  return (
    <div className={cn(className)} style={style} onClick={handleClick}>
      {children({
        isSpinning,
        spinClassName: isSpinning ? "easteregg-spin" : "",
      })}
    </div>
  );
}

