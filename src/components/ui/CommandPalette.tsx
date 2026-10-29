"use client";

import React, { useState, useEffect } from "react";
import { useCompilerStore, PanelTab } from "@/lib/store/compiler-store";
import { EXAMPLES } from "@/lib/examples";
import {
  Search,
  Code2,
  FileCode,
  Layers,
  Zap,
  Binary,
  Terminal,
  Play,
  RotateCcw,
  Sparkles,
  Command,
} from "lucide-react";

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const {
    loadExample,
    setActiveTab,
    compile,
    vmRun,
    vmReset,
  } = useCompilerStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!isOpen) return null;

  const handleSelectExample = (id: string) => {
    loadExample(id);
    setIsOpen(false);
  };

  const handleSelectTab = (tab: PanelTab) => {
    setActiveTab(tab);
    setIsOpen(false);
  };

  const actions = [
    {
      id: "compile",
      name: "Run / Recompile Program",
      icon: Play,
      category: "Compiler",
      action: () => {
        compile();
        setIsOpen(false);
      },
    },
    {
      id: "vm-run",
      name: "Execute in Virtual Machine",
      icon: Terminal,
      category: "Runtime",
      action: () => {
        vmRun();
        setIsOpen(false);
      },
    },
    {
      id: "vm-reset",
      name: "Reset Virtual Machine State",
      icon: RotateCcw,
      category: "Runtime",
      action: () => {
        vmReset();
        setIsOpen(false);
      },
    },
  ];

  const tabs: { id: PanelTab; name: string; icon: any }[] = [
    { id: "tokens", name: "View Tokens Stream", icon: Code2 },
    { id: "ast", name: "View Abstract Syntax Tree (AST)", icon: Layers },
    { id: "symbols", name: "View Scoped Symbol Table", icon: Layers },
    { id: "tac", name: "View Three-Address Code (TAC)", icon: Terminal },
    { id: "cfg", name: "View Control Flow Graph (CFG)", icon: Layers },
    { id: "optimizer", name: "Open Optimization Lab", icon: Zap },
    { id: "bytecode", name: "View Stack Bytecode & VM", icon: Binary },
    { id: "output", name: "View Program Stdout & Codegen", icon: Terminal },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Palette Dialog */}
      <div className="relative z-50 w-full max-w-xl rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden font-mono text-xs">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Type a command or search examples..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-auto p-2 space-y-4">
          {/* Actions */}
          <div>
            <div className="px-2 py-1 text-[10px] uppercase font-semibold text-muted-foreground">
              Actions
            </div>
            {actions.map((act) => {
              const Icon = act.icon;
              return (
                <div
                  key={act.id}
                  onClick={act.action}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-muted/50 text-foreground transition-colors"
                >
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="font-semibold">{act.name}</span>
                </div>
              );
            })}
          </div>

          {/* Load Examples */}
          <div>
            <div className="px-2 py-1 text-[10px] uppercase font-semibold text-muted-foreground">
              Load Sample MiniLang Programs
            </div>
            {EXAMPLES.map((ex) => (
              <div
                key={ex.id}
                onClick={() => handleSelectExample(ex.id)}
                className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer hover:bg-muted/50 text-foreground transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileCode className="h-4 w-4 text-primary" />
                  <div>
                    <div className="font-semibold">{ex.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate max-w-xs">
                      {ex.description}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground">
                  {ex.category}
                </span>
              </div>
            ))}
          </div>

          {/* Navigation Tabs */}
          <div>
            <div className="px-2 py-1 text-[10px] uppercase font-semibold text-muted-foreground">
              Switch Panels
            </div>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <div
                  key={tab.id}
                  onClick={() => handleSelectTab(tab.id)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-muted/50 text-foreground transition-colors"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span>{tab.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
