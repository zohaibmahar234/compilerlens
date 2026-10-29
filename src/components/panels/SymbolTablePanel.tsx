"use client";

import React, { useState } from "react";
import { useCompilerStore } from "@/lib/store/compiler-store";
import { Layers, Search, CheckCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function SymbolTablePanel() {
  const { artifacts, setHoveredSpan } = useCompilerStore();
  const [search, setSearch] = useState("");
  const [selectedKind, setSelectedKind] = useState<string>("ALL");

  const symbolTable = artifacts?.symbolTable;
  const symbols = symbolTable ? symbolTable.getAllSymbols() : [];

  const filteredSymbols = symbols.filter((sym) => {
    if (selectedKind !== "ALL" && sym.kind !== selectedKind) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return sym.name.toLowerCase().includes(q) || sym.type.toLowerCase().includes(q);
    }
    return true;
  });

  const getKindBadge = (kind: string) => {
    switch (kind) {
      case "function":
        return "border-purple-500/30 bg-purple-500/10 text-purple-400";
      case "parameter":
        return "border-blue-500/30 bg-blue-500/10 text-blue-400";
      case "variable":
        return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
      default:
        return "border-slate-500/30 bg-slate-500/10 text-slate-400";
    }
  };

  return (
    <div className="flex flex-col h-full bg-card text-card-foreground">
      {/* Header & Controls */}
      <div className="p-3 border-b border-border/60 flex flex-wrap items-center justify-between gap-2 bg-muted/20">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Symbol Table ({symbols.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search symbol..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-7 w-36 rounded-md border border-border bg-background pl-7 pr-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <select
            value={selectedKind}
            onChange={(e) => setSelectedKind(e.target.value)}
            className="h-7 rounded-md border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Kinds</option>
            <option value="variable">Variables</option>
            <option value="parameter">Parameters</option>
            <option value="function">Functions</option>
          </select>
        </div>
      </div>

      {/* Symbol Table */}
      <div className="flex-1 overflow-auto p-2">
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead>
            <tr className="border-b border-border/40 text-muted-foreground">
              <th className="py-1.5 px-2 font-semibold">Name</th>
              <th className="py-1.5 px-2 font-semibold">Kind</th>
              <th className="py-1.5 px-2 font-semibold">Type</th>
              <th className="py-1.5 px-2 font-semibold">Scope</th>
              <th className="py-1.5 px-2 font-semibold">Init</th>
              <th className="py-1.5 px-2 font-semibold">Refs</th>
              <th className="py-1.5 px-2 font-semibold">Declared At</th>
            </tr>
          </thead>
          <tbody>
            {filteredSymbols.map((sym, idx) => (
              <tr
                key={`${sym.name}-${sym.scopeId}-${idx}`}
                onMouseEnter={() => setHoveredSpan(sym.span)}
                onMouseLeave={() => setHoveredSpan(null)}
                className="border-b border-border/20 hover:bg-muted/40 transition-colors cursor-pointer"
              >
                <td className="py-2 px-2 font-semibold text-foreground">
                  {sym.name}
                </td>
                <td className="py-2 px-2">
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getKindBadge(
                      sym.kind
                    )}`}
                  >
                    {sym.kind}
                  </span>
                </td>
                <td className="py-2 px-2 text-amber-400 font-semibold">
                  {sym.type}
                  {sym.paramTypes ? `(${sym.paramTypes.join(", ")})` : ""}
                </td>
                <td className="py-2 px-2 text-muted-foreground text-[11px]">
                  Scope #{sym.scopeId} (Lvl {sym.scopeLevel})
                </td>
                <td className="py-2 px-2">
                  {sym.isInitialized ? (
                    <span className="flex items-center gap-1 text-emerald-400 text-[11px]">
                      <CheckCircle className="h-3 w-3" /> Yes
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-400 text-[11px]">
                      <AlertCircle className="h-3 w-3" /> No
                    </span>
                  )}
                </td>
                <td className="py-2 px-2 text-muted-foreground">
                  {sym.references.length}
                </td>
                <td className="py-2 px-2 text-muted-foreground text-[11px]">
                  L{sym.span.start.line}:{sym.span.start.column}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredSymbols.length === 0 && (
          <div className="text-center py-8 text-xs text-muted-foreground">
            No symbols registered. Write valid MiniLang declarations to populate.
          </div>
        )}
      </div>
    </div>
  );
}
