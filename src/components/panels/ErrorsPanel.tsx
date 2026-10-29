"use client";

import React from "react";
import { useCompilerStore } from "@/lib/store/compiler-store";
import { AlertCircle, AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorsPanelProps {
  onAskAI?: (errorMsg: string) => void;
}

export function ErrorsPanel({ onAskAI }: ErrorsPanelProps) {
  const { artifacts, setHoveredSpan } = useCompilerStore();

  const lexerErrors = artifacts?.lexerErrors ?? [];
  const parserErrors = artifacts?.parserErrors ?? [];
  const semanticErrors = artifacts?.semanticErrors ?? [];
  const semanticWarnings = artifacts?.semanticWarnings ?? [];

  const totalErrors = lexerErrors.length + parserErrors.length + semanticErrors.length;
  const totalWarnings = semanticWarnings.length;

  return (
    <div className="flex flex-col h-full bg-card text-card-foreground">
      {/* Header */}
      <div className="p-3 border-b border-border/60 flex items-center justify-between bg-muted/20">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Diagnostics ({totalErrors} Errors, {totalWarnings} Warnings)
          </span>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto p-3 space-y-2">
        {totalErrors === 0 && totalWarnings === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mb-2" />
            <p className="font-semibold text-foreground text-sm">Compilation Succeeded</p>
            <p className="text-xs">No lexical, syntactic, or semantic errors found.</p>
          </div>
        ) : (
          <>
            {/* Lexer Errors */}
            {lexerErrors.map((err, idx) => (
              <div
                key={`lex-${idx}`}
                onClick={() => setHoveredSpan(err.span)}
                className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-xs font-mono flex items-start justify-between gap-2 hover:bg-rose-500/15 cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-rose-400 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    [Lexer Error] L{err.span.start.line}:{err.span.start.column}
                  </div>
                  <div className="text-slate-200 mt-1">{err.message}</div>
                </div>
                {onAskAI && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAskAI(err.message);
                    }}
                    className="h-6 text-[11px] border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
                  >
                    <Sparkles className="h-3 w-3 mr-1" /> Explain
                  </Button>
                )}
              </div>
            ))}

            {/* Parser Errors */}
            {parserErrors.map((err, idx) => (
              <div
                key={`parse-${idx}`}
                onClick={() => setHoveredSpan(err.span)}
                className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-xs font-mono flex items-start justify-between gap-2 hover:bg-rose-500/15 cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-rose-400 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    [Parser Error] L{err.span.start.line}:{err.span.start.column}
                  </div>
                  <div className="text-slate-200 mt-1">{err.message}</div>
                  {err.suggestion && (
                    <div className="text-amber-300/80 text-[11px] mt-1 italic">
                      💡 Hint: {err.suggestion}
                    </div>
                  )}
                </div>
                {onAskAI && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAskAI(err.message);
                    }}
                    className="h-6 text-[11px] border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
                  >
                    <Sparkles className="h-3 w-3 mr-1" /> Explain
                  </Button>
                )}
              </div>
            ))}

            {/* Semantic Errors */}
            {semanticErrors.map((err, idx) => (
              <div
                key={`sem-${idx}`}
                onClick={() => setHoveredSpan(err.span)}
                className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-xs font-mono flex items-start justify-between gap-2 hover:bg-rose-500/15 cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-rose-400 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    [Semantic Error: {err.code}] L{err.span.start.line}:{err.span.start.column}
                  </div>
                  <div className="text-slate-200 mt-1">{err.message}</div>
                </div>
                {onAskAI && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAskAI(err.message);
                    }}
                    className="h-6 text-[11px] border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
                  >
                    <Sparkles className="h-3 w-3 mr-1" /> Explain
                  </Button>
                )}
              </div>
            ))}

            {/* Semantic Warnings */}
            {semanticWarnings.map((warn, idx) => (
              <div
                key={`warn-${idx}`}
                onClick={() => setHoveredSpan(warn.span)}
                className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs font-mono flex items-start justify-between gap-2 hover:bg-amber-500/15 cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    [Warning: {warn.code}] L{warn.span.start.line}:{warn.span.start.column}
                  </div>
                  <div className="text-slate-200 mt-1">{warn.message}</div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
