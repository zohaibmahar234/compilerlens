"use client";

import React, { useState } from "react";
import { useCompilerStore } from "@/lib/store/compiler-store";
import { Terminal, Copy, Check, Code2, Cpu, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OutputPanel() {
  const { artifacts, vmState, activeTarget, setActiveTarget } = useCompilerStore();
  const [activeSubTab, setActiveSubTab] = useState<"stdout" | "target">("stdout");
  const [copied, setCopied] = useState(false);

  const outputLines = vmState?.output ?? [];
  const jsCode = artifacts?.jsCode ?? "";
  const asmCode = artifacts?.asmCode ?? "";
  const watCode = artifacts?.watCode ?? "";

  const getCurrentTargetCode = () => {
    switch (activeTarget) {
      case "js":
        return jsCode;
      case "asm":
        return asmCode;
      case "wat":
        return watCode;
    }
  };

  const handleCopy = () => {
    const textToCopy =
      activeSubTab === "stdout" ? outputLines.join("\n") : getCurrentTargetCode();
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-card text-card-foreground">
      {/* Header and Sub-tabs */}
      <div className="p-2.5 border-b border-border/60 flex flex-wrap items-center justify-between gap-2 bg-muted/20">
        <div className="flex items-center gap-1.5">
          <Button
            variant={activeSubTab === "stdout" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSubTab("stdout")}
            className="h-7 text-xs flex items-center gap-1.5"
          >
            <Terminal className="h-3.5 w-3.5" /> Program Output
          </Button>

          <Button
            variant={activeSubTab === "target" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSubTab("target")}
            className="h-7 text-xs flex items-center gap-1.5"
          >
            <Code2 className="h-3.5 w-3.5" /> Target Codegen
          </Button>
        </div>

        {/* Target language selector if on Target tab */}
        {activeSubTab === "target" && (
          <div className="flex items-center gap-1 bg-muted/50 p-0.5 rounded-lg border border-border">
            <button
              onClick={() => setActiveTarget("js")}
              className={`px-2 py-1 text-[11px] font-semibold rounded ${
                activeTarget === "js"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              JavaScript
            </button>
            <button
              onClick={() => setActiveTarget("asm")}
              className={`px-2 py-1 text-[11px] font-semibold rounded ${
                activeTarget === "asm"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              x86-64 ASM
            </button>
            <button
              onClick={() => setActiveTarget("wat")}
              className={`px-2 py-1 text-[11px] font-semibold rounded ${
                activeTarget === "wat"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              WebAssembly (.wat)
            </button>
          </div>
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

      {/* Main View */}
      <div className="flex-1 overflow-auto p-4 bg-[#090d16] font-mono text-xs leading-relaxed">
        {activeSubTab === "stdout" ? (
          <div>
            {outputLines.length === 0 ? (
              <div className="text-muted-foreground/60 italic py-4">
                Program output is empty. Run the program via VM controls to see print statements.
              </div>
            ) : (
              outputLines.map((line, idx) => (
                <div key={idx} className="text-emerald-400 py-0.5">
                  <span className="text-muted-foreground/40 select-none mr-2">&gt;</span>
                  {line}
                </div>
              ))
            )}
          </div>
        ) : (
          <pre className="text-slate-300 overflow-auto">{getCurrentTargetCode()}</pre>
        )}
      </div>
    </div>
  );
}
