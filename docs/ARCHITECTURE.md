# CompilerLens System Architecture

## 1. End-to-End Compiler Pipeline

The diagram below illustrates the sequential transformation pipeline of CompilerLens:

```mermaid
flowchart TD
    Source["MiniLang Source Code\n(Editor / Monaco)"] --> Lexer["Phase 1: Lexical Analysis\n(Lexer.ts)"]
    Lexer --> Tokens["Token Stream\n(Tokens + Source Spans)"]
    Tokens --> Parser["Phase 2: Syntax Analysis\n(Recursive Descent + Pratt)"]
    Parser --> AST["Abstract Syntax Tree\n(AST Nodes)"]
    AST --> Semantic["Phase 3: Semantic Analysis\n(SymbolTable + TypeChecker)"]
    Semantic --> AnnotatedAST["Annotated AST\n(Scoped & Type-Checked)"]
    AnnotatedAST --> IRGen["Phase 4: Intermediate Code Generation\n(TACGenerator)"]
    IRGen --> TAC["Linearized Three-Address Code\n(Quadruples)"]
    TAC --> CFG["Control Flow Graph\n(Basic Blocks + Dominator Tree)"]
    TAC --> Optimizer["Phase 5: Multi-Pass Optimization\n(Folding, Propagation, CSE, Dead-Code, LICM)"]
    Optimizer --> OptimizedTAC["Optimized TAC"]
    OptimizedTAC --> BytecodeGen["Phase 6: Bytecode Generation\n(BytecodeGenerator)"]
    BytecodeGen --> Bytecode["Virtual Machine Instructions\n(Stack Bytecode)"]
    Bytecode --> VM["Stack Virtual Machine\n(Step-by-step VM Stepper)"]
    VM --> Output["Program Stdout & Memory State"]

    OptimizedTAC --> Codegen["Multi-Target Emitters"]
    Codegen --> JS["JavaScript Emitter\n(ES6)"]
    Codegen --> ASM["x86-64 Emitter\n(Intel Syntax)"]
    Codegen --> WAT["WebAssembly Emitter\n(.wat Format)"]
```

---

## 2. Frontend & Web Worker Architecture

To guarantee zero UI latency, all CPU-intensive analysis runs in background Web Workers:

```mermaid
sequenceDiagram
    participant User
    participant Editor as Monaco Editor (UI Thread)
    participant Store as Zustand Store
    participant Worker as Web Worker (Comlink)
    participant Pipeline as Compiler Pipeline

    User->>Editor: Type / Edit MiniLang Code
    Editor->>Store: setCode(newCode)
    Store->>Worker: compile(sourceCode, options)
    Worker->>Pipeline: compileSource()
    Pipeline-->>Worker: CompilationArtifacts (Tokens, AST, TAC, CFG, Bytecode)
    Worker-->>Store: Return Artifacts
    Store->>User: Reactive UI updates across all panels
```

---

## 3. Scoped Symbol Table Hierarchy

MiniLang enforces lexical block scoping with support for inner variable shadowing:

```mermaid
graph TD
    Global["Scope #0: Global\n[functions, global variables]"]
    Global --> FuncFactorial["Scope #1: function:factorial\n[param: n]"]
    FuncFactorial --> Block1["Scope #2: if_consequent\n[local return]"]
    Global --> MainBlock["Scope #3: main\n[result, candidate]"]
    MainBlock --> InnerBlock["Scope #4: block:shadow\n[shadowed variables]"]
```

---

## 4. Virtual Machine Step Execution Loop

```mermaid
stateDiagram-v2
    [*] --> Ready: Load Bytecode
    Ready --> Running: vm.step() / vm.run()
    Running --> Paused: Breakpoint Hit
    Paused --> Running: Resume
    Running --> Halted: HALT opcode or end of stream
    Running --> Error: Division by zero or stack underflow
    Halted --> Ready: vm.reset()
    Error --> Ready: vm.reset()
```

---

## 5. Security & Privacy Guarantees

1. **Client-Side Execution**: All compiler phases, AST parsing, and VM simulations run 100% inside the user's web browser. Source code is never sent to a remote compiler server.
2. **Deterministic Fallbacks**: If the Anthropic Claude API key is absent, the offline rule-based explainer provides immediate feedback without network requests.
