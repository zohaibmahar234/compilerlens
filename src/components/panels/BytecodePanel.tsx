"use client";

import React, { useState } from "react";
import { useCompilerStore } from "@/lib/store/compiler-store";
import { disassembleInstruction } from "@/compiler/codegen/bytecode";
import { Binary, Play, StepForward, RotateCcw, Pause, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BytecodePanel() {
  const {
    artifacts,
    vmState,
    vmStep,
    vmRun,
    vmReset,
    vm,
  } = useCompilerStore();

  const [breakpoints, setBreakpoints] = useState<Set<number>>(new Set());

  const instructions = artifacts?.bytecode ?? [];
  const currentIp = vmState?.ip ?? 0;
  const stack = vmState?.stack ?? [];
  const callStack = vmState?.callStack ?? [];
  const status = vmState?.status ?? "ready";

  const toggleBreakpoint = (address: number) => {
    const next = new Set(breakpoints);
    if (next.has(address)) {
      next.delete(address);
      vm?.removeBreakpoint(address);
    } else {
      next.add(address);
      vm?.addBreakpoint(address);
    }
    setBreakpoints(next);
  };

  return (
    <div className="flex flex-col h-full bg-card text-card-foreground">
      {/* Header and Controls */}
      <div className="p-3 border-b border-border/60 flex flex-wrap items-center justify-between gap-2 bg-muted/20">
        <div className="flex items-center gap-2">
          <Binary className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Bytecode & Stack VM ({instructions.length} Ops)
          </span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold border ${
              status === "halted"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : status === "running"
                ? "border-blue-500/30 bg-blue-500/10 text-blue-400 animate-pulse"
                : status === "paused"
                ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                : status === "error"
                ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                : "border-slate-500/30 bg-slate-500/10 text-slate-400"
            }`}
          >
            {status.toUpperCase()}
          </span>
        </div>

        {/* Stepper buttons */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={vmStep}
            disabled={status === "halted"}
            className="h-7 text-xs flex items-center gap-1"
          >
            <StepForward className="h-3.5 w-3.5 text-primary" /> Step
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={vmRun}
            disabled={status === "halted"}
            className="h-7 text-xs flex items-center gap-1"
          >
            <Play className="h-3.5 w-3.5" /> Run
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={vmReset}
            className="h-7 text-xs flex items-center gap-1"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </Button>
        </div>
      </div>

      {/* Main Container: Split Bytecode & VM Inspector */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Bytecode instruction list */}
        <div className="flex-1 overflow-auto p-3 font-mono text-xs border-r border-border/40 bg-[#090d16]">
          {instructions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No bytecode generated. Compile code to view instructions.
            </div>
          ) : (
            <div className="space-y-0.5">
              {instructions.map((inst) => {
                const isCurrent = inst.address === currentIp;
                const hasBp = breakpoints.has(inst.address);
                const text = disassembleInstruction(inst);

                return (
                  <div
                    key={inst.address}
                    onClick={() => toggleBreakpoint(inst.address)}
                    className={`flex items-center gap-2 px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      isCurrent
                        ? "bg-primary/20 border-l-2 border-primary text-primary-foreground font-semibold"
                        : "hover:bg-slate-800/40 text-slate-300"
                    }`}
                  >
                    {/* Breakpoint indicator */}
                    <span className="w-3 text-center">
                      {hasBp && <Circle className="h-2.5 w-2.5 fill-rose-500 text-rose-500" />}
                    </span>

                    <span className="flex-1">{text}</span>

                    {isCurrent && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary text-primary-foreground">
                        IP
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* VM State Inspector: Operand Stack & Call Frames */}
        <div className="w-full md:w-64 flex flex-col border-t md:border-t-0 border-border/40 bg-card/60 p-3 space-y-4 overflow-auto">
          {/* Operand Stack */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/40 flex justify-between">
              <span>Operand Stack</span>
              <span className="font-mono">{stack.length} items</span>
            </div>
            <div className="pt-2 space-y-1">
              {stack.length === 0 ? (
                <div className="text-[11px] text-muted-foreground italic py-2 text-center">
                  (stack empty)
                </div>
              ) : (
                stack
                  .slice()
                  .reverse()
                  .map((item, idx) => (
                    <div
                      key={idx}
                      className="px-2 py-1 rounded bg-muted/50 border border-border/40 font-mono text-xs flex justify-between"
                    >
                      <span className="text-muted-foreground text-[10px]">
                        [{stack.length - 1 - idx}]
                      </span>
                      <span className="font-bold text-emerald-400">
                        {typeof item === "string" ? `"${item}"` : String(item)}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Call Stack Frames */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/40 flex justify-between">
              <span>Call Stack</span>
              <span className="font-mono">{callStack.length} frames</span>
            </div>
            <div className="pt-2 space-y-2">
              {callStack.length === 0 ? (
                <div className="text-[11px] text-muted-foreground italic py-2 text-center">
                  (global scope)
                </div>
              ) : (
                callStack
                  .slice()
                  .reverse()
                  .map((frame, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-primary/5 border border-primary/30 text-xs font-mono space-y-1"
                    >
                      <div className="font-semibold text-primary flex justify-between">
                        <span>{frame.functionName}</span>
                        <span className="text-[10px] text-muted-foreground">
                          ret: {frame.returnAddress}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300">
                        Locals: {JSON.stringify(frame.locals)}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Globals */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/40">
              Global Variables
            </div>
            <div className="pt-2 space-y-1 font-mono text-xs">
              {Object.keys(vmState?.globals ?? {}).length === 0 ? (
                <div className="text-[11px] text-muted-foreground italic py-1 text-center">
                  (none)
                </div>
              ) : (
                Object.entries(vmState?.globals ?? {}).map(([k, v]) => (
                  <div key={k} className="flex justify-between py-0.5 text-slate-300">
                    <span className="text-primary">{k} =</span>
                    <span className="text-emerald-400 font-semibold">{String(v)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
