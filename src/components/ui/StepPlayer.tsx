"use client";

import React, { useEffect, useRef } from "react";
import { useCompilerStore } from "@/lib/store/compiler-store";
import { Play, Pause, StepForward, RotateCcw, FastForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

export function StepPlayer() {
  const {
    vmState,
    vmStep,
    vmReset,
    vmSpeedMs,
    setVMSpeed,
  } = useCompilerStore();

  const [isPlaying, setIsPlaying] = React.useState(false);
  const timerRef = useRef<any>(null);

  const status = vmState?.status ?? "ready";
  const steps = vmState?.totalSteps ?? 0;

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        if (status === "halted" || status === "error") {
          setIsPlaying(false);
          clearInterval(timerRef.current);
        } else {
          vmStep();
        }
      }, vmSpeedMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, vmSpeedMs, status, vmStep]);

  const togglePlay = () => {
    if (status === "halted") {
      vmReset();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex items-center gap-3 bg-card border border-border/60 rounded-xl px-3 py-1.5 shadow-sm text-xs font-mono">
      {/* Play/Pause */}
      <Button
        variant={isPlaying ? "destructive" : "default"}
        size="iconSm"
        onClick={togglePlay}
        title={isPlaying ? "Pause" : "Auto-step"}
      >
        {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      </Button>

      {/* Step */}
      <Button
        variant="outline"
        size="iconSm"
        onClick={vmStep}
        disabled={isPlaying || status === "halted"}
        title="Step forward"
      >
        <StepForward className="h-3.5 w-3.5" />
      </Button>

      {/* Reset */}
      <Button
        variant="outline"
        size="iconSm"
        onClick={() => {
          setIsPlaying(false);
          vmReset();
        }}
        title="Reset"
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </Button>

      {/* Steps counter */}
      <div className="text-muted-foreground select-none pl-1">
        Steps: <span className="font-semibold text-foreground">{steps}</span>
      </div>

      {/* Speed Slider */}
      <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-border/40">
        <FastForward className="h-3 w-3 text-muted-foreground" />
        <Slider
          value={1000 - vmSpeedMs}
          min={200}
          max={950}
          step={50}
          onChange={(val) => setVMSpeed(1000 - val)}
          className="w-20"
        />
      </div>
    </div>
  );
}
