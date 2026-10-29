"use client";

import React, { useState, useMemo } from "react";
import {
  ContextFreeGrammar,
  computeFirstSets,
  computeFollowSets,
  EPSILON,
  END_MARKER,
} from "@/compiler/grammar-lab/first-follow";
import { buildLL1ParsingTable } from "@/compiler/grammar-lab/ll1-table";
import { AutomataEngine } from "@/compiler/grammar-lab/nfa-dfa";
import { Sparkles, Layers, AlertCircle, CheckCircle2, Play, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";

const SAMPLE_GRAMMARS = [
  {
    name: "Classic Arithmetic Expressions (LL(1) Valid)",
    raw: `E -> T E'
E' -> + T E' | ε
T -> F T'
T' -> * F T' | ε
F -> ( E ) | id`,
    terminals: ["+", "*", "(", ")", "id"],
    nonTerminals: ["E", "E'", "T", "T'", "F"],
    startSymbol: "E",
  },
  {
    name: "Dangling Else Ambiguity (LL(1) Conflict)",
    raw: `S -> if ( C ) S S' | other
S' -> else S | ε
C -> b`,
    terminals: ["if", "(", ")", "else", "other", "b"],
    nonTerminals: ["S", "S'", "C"],
    startSymbol: "S",
  },
  {
    name: "Immediate Left-Recursive (Non-LL(1))",
    raw: `E -> E + T | T
T -> id`,
    terminals: ["+", "id"],
    nonTerminals: ["E", "T"],
    startSymbol: "E",
  },
];

export default function GrammarLabPage() {
  const [selectedSample, setSelectedSample] = useState(0);
  const [grammarText, setGrammarText] = useState(SAMPLE_GRAMMARS[0].raw);
  const [terminalsInput, setTerminalsInput] = useState(
    SAMPLE_GRAMMARS[0].terminals.join(", ")
  );
  const [nonTerminalsInput, setNonTerminalsInput] = useState(
    SAMPLE_GRAMMARS[0].nonTerminals.join(", ")
  );
  const [startSymbol, setStartSymbol] = useState(SAMPLE_GRAMMARS[0].startSymbol);

  // Regex to DFA state
  const [regexInput, setRegexInput] = useState("(a|b)*abb");

  const parsedGrammar = useMemo<ContextFreeGrammar>(() => {
    const lines = grammarText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && l.includes("->"));

    const productions: { lhs: string; rhs: string[] }[] = [];

    for (const line of lines) {
      const [lhs, rhsStr] = line.split("->").map((s) => s.trim());
      const alternatives = rhsStr.split("|").map((alt) => alt.trim());

      for (const alt of alternatives) {
        const symbols = alt
          .split(/\s+/)
          .filter((s) => s.length > 0)
          .map((s) => (s === "e" || s === "eps" || s === "epsilon" || s === "ε" ? EPSILON : s));
        productions.push({ lhs, rhs: symbols });
      }
    }

    const nts = nonTerminalsInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const ts = terminalsInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    return {
      nonTerminals: nts,
      terminals: ts,
      startSymbol: startSymbol || nts[0] || "S",
      productions,
    };
  }, [grammarText, terminalsInput, nonTerminalsInput, startSymbol]);

  const ll1Result = useMemo(() => {
    try {
      return buildLL1ParsingTable(parsedGrammar);
    } catch (e) {
      return null;
    }
  }, [parsedGrammar]);

  // Automata result
  const automataResult = useMemo(() => {
    try {
      const engine = new AutomataEngine();
      const nfa = engine.regexToNFA(regexInput);
      const dfa = engine.nfaToDFA(nfa.states, nfa.startId, nfa.alphabet);
      return { nfa, dfa };
    } catch (e) {
      return null;
    }
  }, [regexInput]);

  const loadSample = (idx: number) => {
    setSelectedSample(idx);
    const s = SAMPLE_GRAMMARS[idx];
    setGrammarText(s.raw);
    setTerminalsInput(s.terminals.join(", "));
    setNonTerminalsInput(s.nonTerminals.join(", "));
    setStartSymbol(s.startSymbol);
  };

  return (
    <div className="container max-w-7xl py-8 space-y-10">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold mb-3">
          <Sparkles className="h-3.5 w-3.5" /> Formal Language & Automata Laboratory
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          FIRST & FOLLOW Sets, LL(1) Tables, and DFA Conversion
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-2 max-w-3xl">
          Inspect predictive parsing preconditions, detect FIRST/FIRST and FIRST/FOLLOW conflicts,
          and convert regular expressions to NFAs and minimal DFAs.
        </p>
      </div>

      {/* Grammar Lab Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Grammar Definition */}
        <div className="lg:col-span-5 rounded-2xl border border-border/70 bg-card p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" /> Grammar Definition
            </h2>

            <select
              value={selectedSample}
              onChange={(e) => loadSample(parseInt(e.target.value, 10))}
              className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {SAMPLE_GRAMMARS.map((s, idx) => (
                <option key={idx} value={idx}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <label className="block text-muted-foreground font-sans font-semibold mb-1">
                Productions (use &apos;-&gt;&apos; and &apos;|&apos;, ε for epsilon):
              </label>
              <textarea
                rows={7}
                value={grammarText}
                onChange={(e) => setGrammarText(e.target.value)}
                className="w-full rounded-lg border border-border bg-[#090d16] p-3 text-slate-200 leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-muted-foreground font-sans font-semibold mb-1">
                  Non-Terminals:
                </label>
                <input
                  type="text"
                  value={nonTerminalsInput}
                  onChange={(e) => setNonTerminalsInput(e.target.value)}
                  className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-muted-foreground font-sans font-semibold mb-1">
                  Terminals:
                </label>
                <input
                  type="text"
                  value={terminalsInput}
                  onChange={(e) => setTerminalsInput(e.target.value)}
                  className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Computed FIRST & FOLLOW Sets */}
        <div className="lg:col-span-7 rounded-2xl border border-border/70 bg-card p-5 space-y-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> FIRST & FOLLOW Sets
            </h2>

            {ll1Result && (
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border flex items-center gap-1 ${
                  ll1Result.isLL1
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-400"
                }`}
              >
                {ll1Result.isLL1 ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" /> LL(1) Valid Grammar
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3.5 w-3.5" /> LL(1) Conflicts Detected
                  </>
                )}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-auto">
            {ll1Result ? (
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-border/40 text-muted-foreground">
                    <th className="py-2 px-3 font-semibold">Non-Terminal</th>
                    <th className="py-2 px-3 font-semibold">FIRST(X)</th>
                    <th className="py-2 px-3 font-semibold">FOLLOW(X)</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedGrammar.nonTerminals.map((nt) => {
                    const firsts = ll1Result.firstSets.get(nt) ?? [];
                    const follows = ll1Result.followSets.get(nt) ?? [];
                    return (
                      <tr key={nt} className="border-b border-border/20">
                        <td className="py-2.5 px-3 font-bold text-primary">{nt}</td>
                        <td className="py-2.5 px-3 text-emerald-400">
                          &#123; {firsts.join(", ")} &#125;
                        </td>
                        <td className="py-2.5 px-3 text-foreground/80">
                          &#123; {follows.join(", ")} &#125;
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-10 text-xs text-muted-foreground">
                Enter valid productions to compute sets.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LL(1) Parsing Table */}
      {ll1Result && (
        <div className="rounded-2xl border border-border/70 bg-card p-5 space-y-4 shadow-sm">
          <h2 className="text-base font-bold flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-primary" /> LL(1) Predictive Parsing Table
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-border/40 text-muted-foreground bg-muted/20">
                  <th className="py-2 px-3 font-semibold">Non-Terminal</th>
                  {ll1Result.terminals.map((t) => (
                    <th key={t} className="py-2 px-3 font-semibold text-center">
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ll1Result.nonTerminals.map((nt) => (
                  <tr key={nt} className="border-b border-border/20">
                    <td className="py-2 px-3 font-bold text-primary">{nt}</td>
                    {ll1Result.terminals.map((t) => {
                      const prods = ll1Result.table.get(nt)?.get(t) ?? [];
                      const hasConflict = prods.length > 1;

                      return (
                        <td
                          key={t}
                          className={`py-2 px-3 text-center border-l border-border/10 ${
                            hasConflict
                              ? "bg-rose-500/20 text-rose-300 font-bold border-rose-500"
                              : prods.length > 0
                              ? "text-slate-200"
                              : "text-muted-foreground/30"
                          }`}
                        >
                          {prods.length === 0 ? (
                            "-"
                          ) : (
                            prods.map((p, i) => (
                              <div key={i}>
                                {p.lhs} &rarr; {p.rhs.join(" ")}
                              </div>
                            ))
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Regular Expression to DFA Section */}
      <div className="rounded-2xl border border-border/70 bg-card p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <Play className="h-4 w-4 text-emerald-400" /> Regular Expression &rarr; NFA &rarr; DFA
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Thompson&apos;s construction &amp; subset construction algorithm.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs w-full sm:w-auto">
            <span className="text-muted-foreground">Regex:</span>
            <input
              type="text"
              value={regexInput}
              onChange={(e) => setRegexInput(e.target.value)}
              className="h-8 rounded-md border border-border bg-background px-3 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-48"
            />
          </div>
        </div>

        {automataResult && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            {/* NFA Stats */}
            <div className="p-4 rounded-xl border border-border/50 bg-[#090d16]">
              <div className="font-semibold text-primary pb-2 border-b border-border/30 mb-2 flex justify-between">
                <span>Thompson NFA</span>
                <span>{automataResult.nfa.states.length} States</span>
              </div>
              <div className="space-y-1 text-slate-300 max-h-48 overflow-auto">
                {automataResult.nfa.states.map((s) => (
                  <div key={s.id} className="flex justify-between py-0.5">
                    <span>
                      State {s.id} {s.isAccept ? "(Accept)" : ""}
                    </span>
                    <span className="text-muted-foreground">
                      {Array.from(s.transitions.entries())
                        .map(([sym, targets]) => `${sym} -> [${targets.join(",")}]`)
                        .join(", ") || "none"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* DFA Transition Table */}
            <div className="p-4 rounded-xl border border-border/50 bg-[#090d16]">
              <div className="font-semibold text-emerald-400 pb-2 border-b border-border/30 mb-2 flex justify-between">
                <span>Subset-Constructed DFA</span>
                <span>{automataResult.dfa.dfaStates.length} States</span>
              </div>
              <div className="space-y-1 text-slate-300 max-h-48 overflow-auto">
                {automataResult.dfa.dfaStates.map((s) => (
                  <div key={s.id} className="flex justify-between py-0.5">
                    <span>
                      {s.name} {s.isAccept ? "(Accept)" : ""}:
                    </span>
                    <span className="text-emerald-300">
                      {Array.from(s.transitions.entries())
                        .map(([sym, target]) => `${sym} -> S${target}`)
                        .join(", ") || "(trap)"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
