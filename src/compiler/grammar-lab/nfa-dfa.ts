export interface NFAState {
  id: number;
  isAccept: boolean;
  transitions: Map<string, number[]>; // symbol -> state IDs ('ε' for epsilon)
}

export interface DFAState {
  id: number;
  name: string;
  isAccept: boolean;
  nfaStates: Set<number>;
  transitions: Map<string, number>; // symbol -> state ID
}

export class AutomataEngine {
  private stateCounter = 0;

  public regexToNFA(regex: string): {
    states: NFAState[];
    startId: number;
    acceptId: number;
    alphabet: string[];
  } {
    this.stateCounter = 0;
    const states: Map<number, NFAState> = new Map();
    const alphabet = new Set<string>();

    const newState = (isAccept = false): NFAState => {
      const s: NFAState = {
        id: this.stateCounter++,
        isAccept,
        transitions: new Map(),
      };
      states.set(s.id, s);
      return s;
    };

    const addTransition = (from: NFAState, symbol: string, to: NFAState) => {
      if (!from.transitions.has(symbol)) {
        from.transitions.set(symbol, []);
      }
      from.transitions.get(symbol)!.push(to.id);
      if (symbol !== "ε") alphabet.add(symbol);
    };

    // Thompson's Construction for simple regexes (characters, '.', '*', '|')
    // Insert explicit concatenation operators '.'
    const formatted = this.insertConcatOperators(regex);
    const postfix = this.infixToPostfix(formatted);

    interface Fragment {
      start: NFAState;
      accept: NFAState;
    }

    const stack: Fragment[] = [];

    for (const token of postfix) {
      if (token === "*") {
        // Kleene star
        const frag = stack.pop()!;
        const start = newState();
        const accept = newState(true);
        frag.accept.isAccept = false;

        addTransition(start, "ε", frag.start);
        addTransition(start, "ε", accept);
        addTransition(frag.accept, "ε", frag.start);
        addTransition(frag.accept, "ε", accept);

        stack.push({ start, accept });
      } else if (token === "|") {
        // Alternation
        const frag2 = stack.pop()!;
        const frag1 = stack.pop()!;
        const start = newState();
        const accept = newState(true);
        frag1.accept.isAccept = false;
        frag2.accept.isAccept = false;

        addTransition(start, "ε", frag1.start);
        addTransition(start, "ε", frag2.start);
        addTransition(frag1.accept, "ε", accept);
        addTransition(frag2.accept, "ε", accept);

        stack.push({ start, accept });
      } else if (token === "•") {
        // Concatenation
        const frag2 = stack.pop()!;
        const frag1 = stack.pop()!;
        frag1.accept.isAccept = false;
        addTransition(frag1.accept, "ε", frag2.start);

        stack.push({ start: frag1.start, accept: frag2.accept });
      } else {
        // Literal symbol
        const start = newState();
        const accept = newState(true);
        addTransition(start, token, accept);
        stack.push({ start, accept });
      }
    }

    const finalFrag = stack.pop() || { start: newState(), accept: newState(true) };

    return {
      states: Array.from(states.values()),
      startId: finalFrag.start.id,
      acceptId: finalFrag.accept.id,
      alphabet: Array.from(alphabet).sort(),
    };
  }

  public nfaToDFA(
    nfaStates: NFAState[],
    startId: number,
    alphabet: string[]
  ): {
    dfaStates: DFAState[];
    startStateId: number;
  } {
    const stateMap = new Map<number, NFAState>(nfaStates.map((s) => [s.id, s]));

    // Epsilon closure computation
    const epsilonClosure = (initial: Set<number>): Set<number> => {
      const closure = new Set(initial);
      const stack = Array.from(initial);

      while (stack.length > 0) {
        const sid = stack.pop()!;
        const st = stateMap.get(sid);
        if (st && st.transitions.has("ε")) {
          for (const nextId of st.transitions.get("ε")!) {
            if (!closure.has(nextId)) {
              closure.add(nextId);
              stack.push(nextId);
            }
          }
        }
      }
      return closure;
    };

    // Subset construction
    let dfaCounter = 0;
    const dfaStates: DFAState[] = [];
    const setKey = (set: Set<number>) => Array.from(set).sort((a, b) => a - b).join(",");
    const visitedSets = new Map<string, number>();

    const startClosure = epsilonClosure(new Set([startId]));
    const startKey = setKey(startClosure);

    const isAccepting = (set: Set<number>) =>
      Array.from(set).some((id) => stateMap.get(id)?.isAccept);

    const startDfaState: DFAState = {
      id: dfaCounter++,
      name: `S0`,
      isAccept: isAccepting(startClosure),
      nfaStates: startClosure,
      transitions: new Map(),
    };

    dfaStates.push(startDfaState);
    visitedSets.set(startKey, startDfaState.id);

    const queue: DFAState[] = [startDfaState];

    while (queue.length > 0) {
      const current = queue.shift()!;

      for (const symbol of alphabet) {
        // Move(current, symbol)
        const moveSet = new Set<number>();
        for (const nid of current.nfaStates) {
          const st = stateMap.get(nid);
          if (st && st.transitions.has(symbol)) {
            for (const targetId of st.transitions.get(symbol)!) {
              moveSet.add(targetId);
            }
          }
        }

        if (moveSet.size === 0) continue;

        const closure = epsilonClosure(moveSet);
        const key = setKey(closure);

        if (!visitedSets.has(key)) {
          const newDfa: DFAState = {
            id: dfaCounter++,
            name: `S${dfaCounter - 1}`,
            isAccept: isAccepting(closure),
            nfaStates: closure,
            transitions: new Map(),
          };
          dfaStates.push(newDfa);
          visitedSets.set(key, newDfa.id);
          queue.push(newDfa);
        }

        current.transitions.set(symbol, visitedSets.get(key)!);
      }
    }

    return {
      dfaStates,
      startStateId: startDfaState.id,
    };
  }

  private insertConcatOperators(regex: string): string {
    let result = "";
    for (let i = 0; i < regex.length; i++) {
      const c1 = regex[i];
      result += c1;
      if (i + 1 < regex.length) {
        const c2 = regex[i + 1];
        if (
          (c1 !== "(" && c1 !== "|" && c2 !== ")" && c2 !== "|" && c2 !== "*") ||
          (c1 === "*" && c2 !== ")" && c2 !== "|")
        ) {
          result += "•";
        }
      }
    }
    return result;
  }

  private infixToPostfix(infix: string): string[] {
    const output: string[] = [];
    const ops: string[] = [];
    const precedence: Record<string, number> = { "*": 3, "•": 2, "|": 1 };

    for (const ch of infix) {
      if (ch === "(") {
        ops.push(ch);
      } else if (ch === ")") {
        while (ops.length > 0 && ops[ops.length - 1] !== "(") {
          output.push(ops.pop()!);
        }
        ops.pop(); // discard '('
      } else if (precedence[ch] !== undefined) {
        while (
          ops.length > 0 &&
          ops[ops.length - 1] !== "(" &&
          precedence[ops[ops.length - 1]] >= precedence[ch]
        ) {
          output.push(ops.pop()!);
        }
        ops.push(ch);
      } else {
        output.push(ch);
      }
    }

    while (ops.length > 0) {
      output.push(ops.pop()!);
    }

    return output;
  }
}
