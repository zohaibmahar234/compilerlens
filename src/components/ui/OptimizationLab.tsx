"use client";

import React from "react";
import { useCompilerStore } from "@/lib/store/compiler-store";
import { Zap, Check, ArrowRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export function OptimizationLab() {
  const { optimizerOptions, setOptimizerOption, artifacts } = useCompilerStore();

  const optResult = artifacts?.optimizerResult;
  const passes = optResult?.passes ?? [];
  const totalChanges = optResult?.totalChanges ?? 0;

  const passesConfig = [
    {
      key: "constantFolding" as const,
      name: "Constant Folding",
      desc: "Evaluates operations on constants at compile time (e.g. 2 + 3 -> 5)",
    },
    {
      key: "constantPropagation" as const,
      name: "Constant Propagation",
      desc: "Substitutes values of known constants into later expressions",
    },
    {
      key: "algebraicSimplification" as const,
      name: "Algebraic Simplification",
      desc: "Simplifies identities like x + 0 -> x, x * 1 -> x, x && true -> x",
    },
    {
      key: "commonSubexpressionElimination" as const,
      name: "Common Subexpression Elimination (CSE)",
      desc: "Reuses previously computed expression values instead of re-evaluating",
    },
    {
      key: "deadCodeElimination" as const,
      name: "Dead Code Elimination",
      desc: "Removes unused variables, temporaries, and unreachable branches",
    },
    {
      key: "loopInvariantCodeMotion" as const,
      name: "Loop Invariant Code Motion",
      desc: "Hoists computations whose operands do not change out of loops",
    },
  ];

  return (
    <div className="flex flex-col h-full bg-card text-card-foreground">
      {/* Header */}
      <div className="p-3 border-b border-border/60 flex items-center justify-between bg-muted/20">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Optimization Lab ({totalChanges} Optimizations Applied)
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Pass Toggles Grid */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Active Optimizer Passes
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {passesConfig.map((item) => (
              <div
                key={item.key}
                className="p-3 rounded-xl border border-border/60 bg-muted/20 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-xs font-semibold text-foreground">{item.name}</div>
                  <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                    {item.desc}
                  </div>
                </div>
                <Switch
                  checked={optimizerOptions[item.key]}
                  onCheckedChange={(checked) => setOptimizerOption(item.key, checked)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Applied Transformations Pipeline */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Transformation History ({passes.length} Passes Triggered)
          </h4>

          {passes.length === 0 ? (
            <div className="text-xs text-muted-foreground italic py-4 text-center border border-border/40 rounded-xl bg-muted/10">
              No optimizations were applicable to the current code.
            </div>
          ) : (
            <div className="space-y-4">
              {passes.map((p, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-border/60 bg-black/40 overflow-hidden font-mono text-xs"
                >
                  <div className="bg-muted/40 px-3 py-2 border-b border-border/40 flex items-center justify-between">
                    <span className="font-semibold text-primary flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      {p.passName}
                    </span>
                    <span className="text-emerald-400 text-[11px]">
                      {p.changesCount} change{p.changesCount > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/40 p-3 gap-2">
                    {/* Before */}
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase pb-1 mb-1 border-b border-border/20">
                        Before Pass
                      </div>
                      <pre className="text-slate-400 overflow-x-auto leading-relaxed max-h-40">
                        {p.beforeCode.join("\n")}
                      </pre>
                    </div>

                    {/* After */}
                    <div>
                      <div className="text-[10px] text-emerald-400 uppercase pb-1 mb-1 border-b border-border/20">
                        After Pass
                      </div>
                      <pre className="text-emerald-300 overflow-x-auto leading-relaxed max-h-40">
                        {p.afterCode.join("\n")}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
