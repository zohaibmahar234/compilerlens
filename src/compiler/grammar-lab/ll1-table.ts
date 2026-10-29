import {
  ContextFreeGrammar,
  GrammarProduction,
  computeFirstSets,
  computeFirstOfSequence,
  computeFollowSets,
  EPSILON,
  END_MARKER,
} from "./first-follow";

export interface LL1TableCell {
  nonTerminal: string;
  terminal: string;
  productions: GrammarProduction[];
  hasConflict: boolean;
}

export interface LL1ParsingTable {
  terminals: string[];
  nonTerminals: string[];
  table: Map<string, Map<string, GrammarProduction[]>>;
  conflicts: {
    nonTerminal: string;
    terminal: string;
    productions: GrammarProduction[];
    conflictType: "FIRST/FIRST" | "FIRST/FOLLOW";
  }[];
  isLL1: boolean;
  firstSets: Map<string, string[]>;
  followSets: Map<string, string[]>;
}

export function buildLL1ParsingTable(grammar: ContextFreeGrammar): LL1ParsingTable {
  const firstSetsMap = computeFirstSets(grammar);
  const followSetsMap = computeFollowSets(grammar, firstSetsMap);

  const terminalsWithEnd = [...grammar.terminals, END_MARKER];
  const table = new Map<string, Map<string, GrammarProduction[]>>();

  for (const nt of grammar.nonTerminals) {
    const row = new Map<string, GrammarProduction[]>();
    for (const t of terminalsWithEnd) {
      row.set(t, []);
    }
    table.set(nt, row);
  }

  const conflicts: LL1ParsingTable["conflicts"] = [];

  for (const prod of grammar.productions) {
    const rhsFirst = computeFirstOfSequence(prod.rhs, firstSetsMap);

    // Rule 1: For each terminal 'a' in FIRST(alpha), add A -> alpha to M[A, a]
    for (const a of rhsFirst) {
      if (a !== EPSILON && grammar.terminals.includes(a)) {
        const cell = table.get(prod.lhs)?.get(a);
        if (cell) {
          cell.push(prod);
        }
      }
    }

    // Rule 2: If epsilon in FIRST(alpha), for each 'b' in FOLLOW(A), add A -> alpha to M[A, b]
    if (rhsFirst.has(EPSILON)) {
      const followA = followSetsMap.get(prod.lhs) ?? new Set();
      for (const b of followA) {
        const cell = table.get(prod.lhs)?.get(b);
        if (cell) {
          // Avoid duplicate insertion of identical production
          if (!cell.includes(prod)) {
            cell.push(prod);
          }
        }
      }
    }
  }

  // Detect conflicts in table
  for (const nt of grammar.nonTerminals) {
    for (const t of terminalsWithEnd) {
      const prods = table.get(nt)?.get(t) ?? [];
      if (prods.length > 1) {
        conflicts.push({
          nonTerminal: nt,
          terminal: t,
          productions: prods,
          conflictType: prods.some((p) => p.rhs.includes(EPSILON))
            ? "FIRST/FOLLOW"
            : "FIRST/FIRST",
        });
      }
    }
  }

  const firstSetsObj = new Map<string, string[]>();
  for (const [k, v] of firstSetsMap.entries()) {
    firstSetsObj.set(k, Array.from(v));
  }

  const followSetsObj = new Map<string, string[]>();
  for (const [k, v] of followSetsMap.entries()) {
    followSetsObj.set(k, Array.from(v));
  }

  return {
    terminals: terminalsWithEnd,
    nonTerminals: grammar.nonTerminals,
    table,
    conflicts,
    isLL1: conflicts.length === 0,
    firstSets: firstSetsObj,
    followSets: followSetsObj,
  };
}
