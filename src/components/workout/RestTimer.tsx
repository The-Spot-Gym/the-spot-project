import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";

const PRESETS = [30, 60, 90, 120, 180];

export const RestTimer = () => {
  const [duration, setDuration] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<AudioContext | null>(null);

  const playBeep = useCallback(() => {
    try {
      const ctx = audioRef.current || new AudioContext();
      audioRef.current = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.value = 0.3;
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  }, []);

  useEffect(() => {
    if (running && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);
    } else if (timeLeft === 0 && running) {
      setRunning(false);
      playBeep();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, timeLeft, playBeep]);

  const toggle = () => {
    if (timeLeft === 0) {
      setTimeLeft(duration);
    }
    setRunning((r) => !r);
  };

  const reset = () => {
    setRunning(false);
    setTimeLeft(duration);
  };

  const selectPreset = (secs: number) => {
    setDuration(secs);
    setTimeLeft(secs);
    setRunning(false);
  };

  const progress = duration > 0 ? ((duration - timeLeft) / duration) * 100 : 0;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const finished = timeLeft === 0 && !running;

  return (
    <div className="bg-card border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5" /> Rest Timer
        </h2>
        <div className="flex gap-1">
          {PRESETS.map((s) => (
            <button
              key={s}
              onClick={() => selectPreset(s)}
              className={`text-[10px] px-1.5 py-0.5 rounded-full transition-colors ${
                duration === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {s >= 60 ? `${s / 60}m` : `${s}s`}
            </button>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ${
            finished ? "bg-secondary" : "bg-primary"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className={`text-2xl font-mono font-bold tabular-nums ${finished ? "text-secondary animate-pulse" : ""}`}>
          {mins}:{secs.toString().padStart(2, "0")}
        </span>
        <div className="flex gap-1.5">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={reset}>
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant={running ? "outline" : "fitness"}
            size="icon"
            className="h-8 w-8"
            onClick={toggle}
          >
            {running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>
    </div>
  );
};
