"use client";

import React, { useState, useEffect } from "react";
import { PanelLayout } from "@/components/layout/PanelLayout";
import { useCompilerStore } from "@/lib/store/compiler-store";
import { Dialog } from "@/components/ui/dialog";
import { Sparkles, Bot, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PlaygroundPage() {
  const { code } = useCompilerStore();
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [targetError, setTargetError] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // Read URL hash on load for shared links
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const match = window.location.hash.match(/code=([^&]+)/);
      if (match && match[1]) {
        try {
          const decoded = decodeURIComponent(match[1]);
          useCompilerStore.getState().setCode(decoded);
        } catch (e) {
          // ignore
        }
      }
    }
  }, []);

  const handleAskAI = async (errorMsg: string) => {
    setTargetError(errorMsg);
    setAiModalOpen(true);
    setIsLoadingAI(true);
    setAiResponse("");

    try {
      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceCode: code,
          errorMessage: errorMsg,
        }),
      });

      if (!res.ok) throw new Error("Failed to contact AI explainer");
      const data = await res.json();
      setAiResponse(data.explanation || data.message || "No explanation returned.");
    } catch (err: any) {
      setAiResponse(
        `Offline Diagnostic: The compiler error "${errorMsg}" suggests a syntax or type inconsistency. Check token positions and expected type constraints in docs/GRAMMAR.md.`
      );
    } finally {
      setIsLoadingAI(false);
    }
  };

  return (
    <div className="relative w-full h-full">
      <PanelLayout onAskAI={handleAskAI} />

      {/* AI Explanation Modal */}
      <Dialog open={aiModalOpen} onOpenChange={setAiModalOpen}>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <Sparkles className="h-5 w-5" />
            <h3>AI Compiler Tutor Diagnostic</h3>
          </div>

          <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-xs font-mono text-rose-300">
            <strong>Error:</strong> {targetError}
          </div>

          <div className="min-h-[140px] max-h-80 overflow-auto p-3 rounded-xl border border-border/60 bg-muted/20 text-xs text-slate-200 leading-relaxed font-sans">
            {isLoadingAI ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span>Analyzing code structure & generating tutorial hint...</span>
              </div>
            ) : (
              <div className="whitespace-pre-line">{aiResponse}</div>
            )}
          </div>

          <div className="flex justify-end">
            <Button size="sm" onClick={() => setAiModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
