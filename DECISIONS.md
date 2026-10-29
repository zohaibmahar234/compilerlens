# Architecture Decision Records (ADR) - CompilerLens

## ADR-001: Pure TypeScript Web Worker Compiler Architecture
- **Context**: Visualizing a compiler requires high-frequency compilation on every keystroke without freezing the UI or demanding backend server resources.
- **Decision**: Implement all compiler phases (Lexer, Parser, AST, Semantic Analysis, TAC IR, CFG, Optimizer, Bytecode Generator, Stack VM, JS/ASM/WAT Gen) in pure, dependency-free TypeScript executed within a dedicated Web Worker via `comlink`.
- **Consequences**: Zero server latency, instant visual feedback, offline capability, completely reproducible student executions, and simplified deployment to static edge hosts (Vercel, GitHub Pages).

## ADR-002: Recursive Descent Parsing with Pratt-Style Precedence Climbing
- **Context**: MiniLang requires unambiguous parsing of binary arithmetic, relational, and logical expressions with diverse precedence and associativity, while providing helpful compiler error messages for novice learners.
- **Decision**: Employ recursive descent for top-level grammar constructs, statements, and blocks, combined with Pratt-style precedence climbing for expressions.
- **Consequences**: Clear, traceable parse tree construction; trivial synchronization and error recovery insertion at statement/block boundaries; precise span and location mapping for every node.

## ADR-003: Linearized Three-Address Code (TAC) and Basic Block CFG
- **Context**: Intermediate Representation (IR) needs to be accessible to students yet expressive enough to execute classic optimizations (constant folding, dead code elimination, common subexpression elimination, loop-invariant code motion).
- **Decision**: Design a Quadruple/TAC instruction format with explicit labels, temporaries, jumps, and arguments. Form Basic Blocks via leader analysis and build a Control Flow Graph (CFG) with explicit predecessor/successor links.
- **Consequences**: Enables side-by-side visualization of high-level source code, AST, linearized IR, and graphical flowcharts with React Flow.

## ADR-004: Stack-Based Virtual Machine with Deterministic Step Stepper
- **Context**: Learners need to see *how* code runs, from instruction pointer to operand stack manipulations and local environment frames.
- **Decision**: Implement a stack-based Bytecode VM with opcodes (`PUSH`, `LOAD`, `STORE`, `ADD`, `JMP`, `CALL`, `RET`, etc.) capable of synchronous step-by-step stepping, reverse step inspection, and breakpoints.
- **Consequences**: Provides intuitive mental model matching classic educational virtual machines (JVM, Python bytecode) with direct stack visualization.

## ADR-005: Hybrid AI Assistance with Rule-Based Offline Fallback
- **Context**: Students encountering compiler errors benefit from Claude 3.5 Sonnet pedagogical explanations. However, network issues or missing API keys shouldn't degrade the learning experience.
- **Decision**: Expose an API route communicating with Anthropic Claude SDK when `ANTHROPIC_API_KEY` is present. When absent, seamlessly fall back to an internal rule-based static analyzer that provides deterministic diagnostic explanations and code repair hints.
- **Consequences**: Robust UX that works 100% offline out-of-the-box, with optional AI superpowers when configured.
