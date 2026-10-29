export interface GrammarProduction {
  lhs: string; // e.g. "E"
  rhs: string[]; // e.g. ["T", "E'"] or ["ε"]
}

export interface ContextFreeGrammar {
  nonTerminals: string[];
  terminals: string[];
  startSymbol: string;
  productions: GrammarProduction[];
}

export const EPSILON = "ε";
export const END_MARKER = "$";

export function computeFirstSets(grammar: ContextFreeGrammar): Map<string, Set<string>> {
  const first = new Map<string, Set<string>>();

  // Initialize empty sets
  for (const nt of grammar.nonTerminals) {
    first.set(nt, new Set<string>());
  }
  for (const t of grammar.terminals) {
    first.set(t, new Set<string>([t]));
  }
  first.set(EPSILON, new Set<string>([EPSILON]));

  let changed = true;
  while (changed) {
    changed = false;

    for (const prod of grammar.productions) {
      const lhsSet = first.get(prod.lhs)!;
      const beforeSize = lhsSet.size;

      if (prod.rhs.length === 1 && prod.rhs[0] === EPSILON) {
        lhsSet.add(EPSILON);
      } else {
        let allDeriveEpsilon = true;

        for (const symbol of prod.rhs) {
          const symFirst = first.get(symbol) ?? new Set([symbol]);

          for (const item of symFirst) {
            if (item !== EPSILON) {
              lhsSet.add(item);
            }
          }

          if (!symFirst.has(EPSILON)) {
            allDeriveEpsilon = false;
            break;
          }
        }

        if (allDeriveEpsilon) {
          lhsSet.add(EPSILON);
        }
      }

      if (lhsSet.size > beforeSize) {
        changed = true;
      }
    }
  }

  return first;
}

export function computeFirstOfSequence(
  sequence: string[],
  firstSets: Map<string, Set<string>>
): Set<string> {
  const result = new Set<string>();
  if (sequence.length === 0 || (sequence.length === 1 && sequence[0] === EPSILON)) {
    result.add(EPSILON);
    return result;
  }

  let allDeriveEpsilon = true;
  for (const sym of sequence) {
    const symFirst = firstSets.get(sym) ?? new Set([sym]);
    for (const f of symFirst) {
      if (f !== EPSILON) result.add(f);
    }
    if (!symFirst.has(EPSILON)) {
      allDeriveEpsilon = false;
      break;
    }
  }

  if (allDeriveEpsilon) {
    result.add(EPSILON);
  }

  return result;
}

export function computeFollowSets(
  grammar: ContextFreeGrammar,
  firstSets: Map<string, Set<string>>
): Map<string, Set<string>> {
  const follow = new Map<string, Set<string>>();

  for (const nt of grammar.nonTerminals) {
    follow.set(nt, new Set<string>());
  }

  // Rule 1: Add '$' to start symbol
  if (grammar.startSymbol && follow.has(grammar.startSymbol)) {
    follow.get(grammar.startSymbol)!.add(END_MARKER);
  }

  let changed = true;
  while (changed) {
    changed = false;

    for (const prod of grammar.productions) {
      const lhsFollow = follow.get(prod.lhs)!;

      for (let i = 0; i < prod.rhs.length; i++) {
        const symbol = prod.rhs[i];
        if (!grammar.nonTerminals.includes(symbol)) continue;

        const symFollow = follow.get(symbol)!;
        const beforeSize = symFollow.size;

        const beta = prod.rhs.slice(i + 1);
        const betaFirst = computeFirstOfSequence(beta, firstSets);

        // Rule 2: Add FIRST(beta) except epsilon to FOLLOW(B)
        for (const item of betaFirst) {
          if (item !== EPSILON) {
            symFollow.add(item);
          }
        }

        // Rule 3: If beta is empty or beta derives epsilon, add FOLLOW(A) to FOLLOW(B)
        if (betaFirst.has(EPSILON) || beta.length === 0) {
          for (const item of lhsFollow) {
            symFollow.add(item);
          }
        }

        if (symFollow.size > beforeSize) {
          changed = true;
        }
      }
    }
  }

  return follow;
}
