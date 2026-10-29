"use client";

import React, { useState } from "react";
import { useCompilerStore, PanelTab } from "@/lib/store/compiler-store";
import { EXAMPLES } from "@/lib/examples";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { TokensPanel } from "@/components/panels/TokensPanel";
import { ParseTreePanel } from "@/components/panels/ParseTreePanel";
import { ASTPanel } from "@/components/panels/ASTPanel";
import { SymbolTablePanel } from "@/components/panels/SymbolTablePanel";
import { TACPanel } from "@/components/panels/TACPanel";
import { CFGPanel } from "@/components/panels/CFGPanel";
import { BytecodePanel } from "@/components/panels/BytecodePanel";
import { OutputPanel } from "@/components/panels/OutputPanel";
import { ErrorsPanel } from "@/components/panels/ErrorsPanel";
import { OptimizationLab } from "@/components/ui/OptimizationLab";
import { StepPlayer } from "@/components/ui/StepPlayer";
import { CommandPalette } from "@/components/ui/CommandPalette";
import {
  Code2,
  GitBranch,
  Layers,
  Terminal,
  Zap,
  Binary,
  AlertCircle,
  Play,
  RotateCcw,
  Sparkles,
  Command,
  Share2,
  FileCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PanelLayoutProps {
  onAskAI?: (errorMsg: string) => void;
}

export function PanelLayout({ onAskAI }: PanelLayoutProps) {
  const {
    activeTab,
    setActiveTab,
    loadExample,
    selectedExampleId,
    compile,
    artifacts,
  } = useCompilerStore();

  const [shareCopied, setShareCopied] = useState(false);

  const totalErrors = artifacts?.totalErrors ?? 0;

  const tabs: { id: PanelTab; label: string; icon: any; badge?: number }[] = [
    { id: "tokens", label: "Tokens", icon: Code2 },
    { id: "ast", label: "AST", icon: GitBranch },
    { id: "symbols", label: "Symbols", icon: Layers },
    { id: "tac", label: "TAC IR", icon: Terminal },
    { id: "cfg", label: "CFG", icon: Layers },
    { id: "optimizer", label: "Optimizer", icon: Zap },
    { id: "bytecode", label: "Bytecode/VM", icon: Binary },
    { id: "output", label: "Output", icon: Terminal },
    {
      id: "errors",
      label: "Errors",
      icon: AlertCircle,
      badge: totalErrors > 0 ? totalErrors : undefined,
    },
  ];

  const handleShare = () => {
    const { code } = useCompilerStore.getState();
    const encoded = encodeURIComponent(code);
    window.location.hash = `code=${encoded}`;
    navigator.clipboard.writeText(window.location.href);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-background">
      <CommandPalette />

      {/* Top Studio Action Bar */}
      <div className="h-12 border-b border-border/60 bg-card/60 backdrop-blur px-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Example Selector */}
          <div className="flex items-center gap-2">
            <FileCode className="h-4 w-4 text-primary" />
            <select
              value={selectedExampleId}
              onChange={(e) => loadExample(e.target.value)}
              className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <optgroup label="Sample Programs">
                {EXAMPLES.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <Button
            size="sm"
            onClick={compile}
            className="h-8 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Play className="h-3.5 w-3.5 fill-current" /> Compile
          </Button>

          {/* Stepper Controls */}
          <div className="hidden lg:block">
            <StepPlayer />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Share Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="h-8 text-xs flex items-center gap-1.5"
          >
            <Share2 className="h-3.5 w-3.5" />
            {shareCopied ? "Link Copied!" : "Share"}
          </Button>

          {/* Command Palette Hint */}
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-border bg-muted px-2 py-1 text-[10px] font-mono text-muted-foreground select-none">
            <Command className="h-3 w-3" /> K
          </kbd>
        </div>
      </div>

      {/* Main Workspace (Split View) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Column: Editor */}
        <div className="w-full md:w-1/2 h-1/2 md:h-full border-b md:border-b-0 md:border-r border-border/60 flex flex-col bg-background">
          <div className="h-8 border-b border-border/40 bg-muted/20 px-3 flex items-center justify-between text-xs font-mono text-muted-foreground">
            <span>MiniLang Editor (main.mini)</span>
            <span className="text-[11px] text-emerald-400">Strict TypeScript VM</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <CodeEditor />
          </div>
        </div>

        {/* Right Column: Multi-Phase Inspector Tabs */}
        <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col bg-card">
          {/* Tabs bar */}
          <div className="flex items-center overflow-x-auto border-b border-border/60 bg-muted/30 px-1 py-1 no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all select-none ${
                    isActive
                      ? "bg-background text-foreground shadow-sm font-bold border border-border/60"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className="h-4 w-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content Display */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "tokens" && <TokensPanel />}
            {activeTab === "ast" && <ASTPanel />}
            {activeTab === "symbols" && <SymbolTablePanel />}
            {activeTab === "tac" && <TACPanel />}
            {activeTab === "cfg" && <CFGPanel />}
            {activeTab === "optimizer" && <OptimizationLab />}
            {activeTab === "bytecode" && <BytecodePanel />}
            {activeTab === "output" && <OutputPanel />}
            {activeTab === "errors" && <ErrorsPanel onAskAI={onAskAI} />}
          </div>
        </div>
      </div>
    </div>
  );
}
