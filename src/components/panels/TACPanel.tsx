"use client";

import React, { useState } from "react";
import { useCompilerStore } from "@/lib/store/compiler-store";
import { formatInstruction } from "@/compiler/ir/tac";
import { Copy, Check, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TACPanel() {
  const { artifacts } = useCompilerStore();
  const [copied, setCopied] = useState(false);
  const [showOptimized, setShowOptimized] = useState(false);

  const rawInstructions = artifacts?.tacProgram?.instructions ?? [];
  const optInstructions = artifacts?.optimizerResult?.optimizedInstructions ?? [];

  const instructions = showOptimized && optInstructions.length > 0 ? optInstructions : rawInstructions;

  const handleCopy = () => {
    const text = instructions.map(formatInstruction).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightLine = (line: string) => {
    if (line.startsWith("label")) {
      return <span className="text-purple-400 font-bold">{line}</span>;
    }
    if (line.startsWith("goto") || line.startsWith("if")) {
      return <span className="text-cyan-400">{line}</span>;
    }
    if (line.startsWith("return")) {
      return <span className="text-rose-400 font-semibold">{line}</span>;
    }
    if (line.startsWith("print") || line.startsWith("call") || line.startsWith("param")) {
      return <span className="text-amber-400">{line}</span>;
    }
    return <span className="text-slate-200">{line}</span>;
  };

  return (
    <div className="flex flex-col h-full bg-card text-card-foreground">
      {/* Header */}
      <div className="p-3 border-b border-border/60 flex items-center justify-between bg-muted/20">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Three-Address Code (TAC)
          </span>
          {showOptimized && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Optimized
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {optInstructions.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOptimized(!showOptimized)}
              className="h-7 text-xs"
            >
              {showOptimized ? "Show Raw TAC" : "Show Optimized TAC"}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-7 text-xs flex items-center gap-1"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>

      {/* Code Viewer */}
      <div className="flex-1 overflow-auto p-4 bg-[#090d16] font-mono text-xs leading-relaxed">
        {instructions.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            No IR instructions generated. Enter valid code to emit TAC.
          </div>
        ) : (
          <div className="space-y-0.5">
            {instructions.map((inst, index) => {
              const formatted = formatInstruction(inst);
              return (
                <div key={index} className="flex items-start hover:bg-slate-800/40 px-1 py-0.5 rounded">
                  <span className="w-8 select-none text-muted-foreground/50 text-right pr-4">
                    {index + 1}
                  </span>
                  <div className="flex-1 font-mono">{highlightLine(formatted)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
