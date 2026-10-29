# CompilerLens: An AI-Powered Interactive Compiler Visualization and Pedagogical Platform

**Author**: Senior Compiler Engineering Research Group  
**Academic Degree**: Bachelor / Master of Science in Computer Science  
**Subject**: Advanced Compiler Design, Formal Languages, and Program Analysis  
**Date**: October 2026  

---

## 1. Abstract

Understanding the internal mechanisms of programming language compilers remains one of the most intellectually demanding subjects in computer science pedagogy. Abstract concepts such as non-deterministic automata conversions, Abstract Syntax Tree (AST) construction, multi-level symbol tables, Three-Address Code (TAC) linearization, Control Flow Graph (CFG) dominator analysis, and stack-based virtual machine runtimes are conventionally taught through static textbook diagrams.

This paper presents **CompilerLens**, an interactive web platform and pure TypeScript compiler implementation for **MiniLang**—a strongly typed C-like language. CompilerLens exposes every phase of the compiler pipeline in real time. We describe the engineering design of a hand-written recursive-descent Pratt parser, a two-pass semantic analyzer, a modular intermediate optimization engine, and a deterministic stack virtual machine with step-by-step execution. Furthermore, we demonstrate integration with Anthropic Claude 3.5 Sonnet for automated compiler diagnostic remediation alongside a Formal Grammar Laboratory that constructs FIRST/FOLLOW sets and LL(1) tables with conflict identification.

---

## 2. Introduction & Motivation

Modern software engineering heavily depends on compilers and just-in-time (JIT) runtimes (e.g., LLVM, V8, JVM). However, compiler courses frequently exhibit steep learning curves due to the "black-box" nature of compilation: students provide source text and inspect the resulting executable without transparent visibility into intermediate transformations.

Existing educational tools typically isolate individual topics (e.g., JFLAP for automata, AST Explorer for syntax trees), lacking a unified, end-to-end framework where a single keystroke concurrently updates the token stream, syntax tree, symbol table, TAC intermediate representation, basic blocks, optimization passes, bytecode, and virtual machine stack state.

CompilerLens addresses this challenge by providing:
1. An end-to-end compilation pipeline executing purely within client-side Web Workers.
2. Synchronized interactive visualizations utilizing React Flow and Monaco Editor.
3. Multi-target code emission into ES6 JavaScript, x86-64 Intel assembly, and WebAssembly Text (WAT).
4. Pedagogical error diagnostics combining Large Language Models with deterministic static analysis rules.

---

## 3. MiniLang Language Specification

MiniLang is designed to encompass fundamental imperative and structured programming paradigms without incidental complexity:
- **Primitives**: 32-bit signed integers (\`int\`), single-precision floats (\`float\`), booleans (\`bool\`), and string literals (\`string\`).
- **Control Flow**: Conditionals (\`if\`, \`else\`, chained \`else if\`), unbounded loops (\`while\`), and counted iterations (\`for\`).
- **Subroutines**: Multi-parameter functions with explicit return types and lexical block scoping.
- **Recursion**: Unrestricted recursive calls with stack frame management.
- **I/O**: Standard variadic \`print(...)\` primitives.

Formal grammar in EBNF notation and operator binding precedence tables are cataloged in \`docs/GRAMMAR.md\`.

---

## 4. Architectural Design & Implementation

### 4.1 Lexical Analysis (Scanner)
The hand-written lexer (\`src/compiler/lexer/lexer.ts\`) processes UTF-8 source strings using deterministic lookahead buffers. Unlike naive regular expression splitters, the lexer maintains character offsets, 1-indexed line counters, and column coordinates on each produced token (\`Token\`). It supports string escape sequences (\`\\n\`, \`\\t\`, \`\\"\`), floating-point validation, and multi-line non-nesting block comments (\`/* ... */\`).

### 4.2 Syntax Analysis & Pratt Precedence Climbing
Syntax analysis (\`src/compiler/parser/parser.ts\`) is realized via recursive descent for top-level grammar units combined with Pratt precedence climbing for arithmetic, comparison, and logical expressions. This eliminates the parsing ambiguity inherent in flat context-free grammars while ensuring exact associativity:
- Left-associative binary operators: \`+\`, \`-\`, \`*\`, \`/\`, \`%\`, \`==\`, \`!=\`, \`<\`, \`<=\`, \`>\`, \`>=\`, \`&&\`, \`||\`.
- Right-associative unary operators: \`-\` (negation), \`!\` (logical inversion).

Panic-mode error recovery synchronizes on statement terminators (\`;\`, \`}\`) and keyword boundaries, allowing the parser to gather multiple syntactic defects in a single pass without cascading aborts.

### 4.3 Semantic Analysis & Scoped Symbol Tables
The semantic analyzer (\`src/compiler/semantic/analyzer.ts\`) executes in two passes:
- **Pass 1 (Function Hoisting)**: Traverses all function declarations in the global scope to register signatures, parameter types, and return contracts. This permits forward function calls and mutual recursion without header prototypes.
- **Pass 2 (Type Checking & Lifetime Verification)**: Verifies symbol initialization, enforces strict static typing, and validates that every non-void function returns along all deterministic execution branches.

### 4.4 Intermediate Representation (TAC) & Control Flow Graphs
The IR generator (\`src/compiler/ir/ir-gen.ts\`) translates AST structures into Three-Address Code (TAC) Quadruples. Complex boolean expressions in conditionals and loops are translated with short-circuiting jumps. 

Basic blocks are partitioned via leader analysis:
1. The initial instruction is a leader.
2. Any instruction that is the target of a conditional or unconditional branch is a leader.
3. Any instruction immediately succeeding a branch or return is a leader.

The Control Flow Graph (\`src/compiler/ir/cfg.ts\`) computes predecessor and successor relationships and calculates the Dominance relation using the iterative dataflow framework.

### 4.5 Modular Multi-Pass Optimizer
The optimization suite (\`src/compiler/optimizer/\`) features six independent passes that can be toggled by students:
1. **Constant Folding**: Evaluates constant arithmetic and relational operators at compile time.
2. **Constant Propagation**: Propagates known constants to subsequent usages across basic blocks.
3. **Algebraic Simplification**: Applies algebraic identity reductions ($x \times 1 = x$, $x + 0 = x$, $x \times 0 = 0$).
4. **Common Subexpression Elimination (CSE)**: Identifies redundant computations within basic blocks.
5. **Dead Code Elimination (DCE)**: Eliminates dead temporary variables and removes unreachable instructions after unconditional branches.
6. **Loop-Invariant Code Motion (LICM)**: Hoists computations whose operands are invariant out of loop headers into preheaders.

### 4.6 Virtual Machine & Multi-Target Emitters
- **Stack VM**: Implements 28 opcodes with an instruction pointer, operand evaluation stack, and nested call frames. Execution can be stepped forward or run to completion with user-configured breakpoints.
- **Code Generators**: Produces clean ES6 JavaScript, x86-64 Intel assembly with standard System V / Windows x64 register calling conventions, and WebAssembly Text (WAT).

---

## 5. Verification & Testing

CompilerLens is validated by an extensive automated test suite comprising **120+ unit tests** and Playwright end-to-end tests:
- **Lexer Tests** (\`tests/unit/lexer.test.ts\`): 40+ test cases covering numbers, floats, string escapes, invalid tokens, comments, and span coordinates.
- **Parser Tests** (\`tests/unit/parser.test.ts\`): 20+ test cases verifying grammar productions, operator precedence, associativity, and error recovery.
- **Semantic Tests** (\`tests/unit/semantic.test.ts\`): 30+ test cases covering variable re-declarations, shadowing, type mismatches, missing returns, and argument arity.
- **IR & Optimization Tests** (\`tests/unit/ir.test.ts\`): 32 test cases evaluating TAC emission, CFG dominator computation, and optimizer convergence.
- **Code Generation & VM Tests** (\`tests/unit/codegen.test.ts\`): Validating recursive Factorial, Fibonacci, and trial-division Prime checking in the virtual machine.

---

## 6. Conclusion & Future Work

CompilerLens demonstrates that a complete, robust, multi-phase compiler pipeline can be architected entirely in pure TypeScript and deployed in modern web browsers without server dependencies. By coupling transparent visualizations with automated AI pedagogical assistance and formal language tools, the platform provides computer science students with unprecedented visibility into the inner workings of compilers.

Future research directions include extending MiniLang to support structured compound records (\`struct\`), first-class arrays with bounds checking, and an automated SSA (Static Single Assignment) form converter with $\phi$-node visualization.
