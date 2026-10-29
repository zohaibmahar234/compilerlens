# CompilerLens 🔍

> **An AI-powered interactive web platform that visualizes every phase of a compiler for MiniLang.**

CompilerLens brings compiler theory to life. Developed for computer science education, it allows students and engineers to write programs in **MiniLang** (a typed C-like language) and inspect every internal compiler representation in real time: from tokenization and recursive-descent parsing to TAC intermediate representation, CFG dominators, multi-pass optimizations, stack bytecode, and virtual machine execution.

---

## ✨ Features

- **01. Lexical Analysis Panel**: View token streams with spans, category badges (Keywords, Identifiers, Literals, Operators, Delimiters), and search filters.
- **02. Syntax Analysis & AST Tree**: Interactive, expandable Abstract Syntax Tree hierarchy with inferred types and source span correlation, plus full JSON export.
- **03. React Flow Visualizations**:
  - Interactive Parse Tree graph layout.
  - Basic Block Control Flow Graph (CFG) with leader analysis, entry/exit indicators, and dominator computation.
- **04. Scoped Symbol Table**: Multi-level lexical scoping with parent/child links, shadowing support, and reference tracking.
- **05. Three-Address Code (TAC) Engine**: Linearized Quadruples with clean label management and short-circuit evaluation.
- **06. Optimization Lab**: Toggle switches and before/after diffs for:
  - Constant Folding
  - Constant Propagation
  - Algebraic Simplification (identities like $x + 0 \to x$, $x \times 1 \to x$)
  - Common Subexpression Elimination (CSE)
  - Dead Code Elimination (unused temporaries and unreachable blocks)
  - Loop Invariant Code Motion (LICM)
- **07. Bytecode & Stack Virtual Machine**:
  - Complete stack VM with instruction pointer (IP), operand stack visualizer, and call frames.
  - Step-by-step debugger with breakpoints, auto-stepping, and speed controls.
- **08. Multi-Target Code Generation**:
  - ES6 JavaScript with runtime helpers.
  - x86-64 Intel-syntax assembly with calling conventions.
  - WebAssembly Text (WAT) format.
- **09. AI Compiler Tutor & Explainer**:
  - Powered by Anthropic Claude 3.5 Sonnet API.
  - Intelligent, offline rule-based fallback when working without an API key.
- **10. Formal Grammar Lab**:
  - Compute FIRST and FOLLOW sets for any Context-Free Grammar.
  - LL(1) Parsing Table generator with conflict detection (FIRST/FIRST and FIRST/FOLLOW).
  - Regular Expression to NFA (Thompson's construction) and DFA (Subset construction).
- **11. Interactive Curriculum & Quizzes**: 6 core compiler engineering modules with knowledge-check quizzes and verifiable badges.
- **12. Sharing & Export**: URL-encoded permalinks, PDF compiler reports via jsPDF, PNG export via html2canvas, and PWA offline support.

---

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router), React 18, TypeScript strict mode
- **Styling & UI**: Tailwind CSS, Radix UI primitives, Lucide React, Framer Motion
- **Editor**: Monaco Editor (`@monaco-editor/react`) with custom MiniLang monarch tokenizer
- **Graphs**: React Flow (`reactflow`) with custom block nodes
- **State**: Zustand
- **Worker**: Web Workers via `comlink` for background compilation
- **Testing**: Vitest (`vitest`), Playwright (`@playwright/test`)
- **AI**: Anthropic Claude SDK (`@anthropic-ai/sdk`)

---

## 🚀 Quick Start

### 1. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Configure Environment (Optional)
Copy `.env.example` to `.env.local`:
\`\`\`bash
cp .env.example .env.local
\`\`\`
Set your Anthropic API key to enable live Claude tutor answers (offline fallback works automatically if omitted):
\`\`\`env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
\`\`\`

### 3. Run Development Server
\`\`\`bash
npm run dev
\`\`\`
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Test Suite
\`\`\`bash
# Run all unit tests (Lexer, Parser, Semantic Analyzer, IR/Optimizer, Codegen/VM)
npm test

# Run End-to-End tests
npm run test:e2e
\`\`\`

---

## 📂 Project Structure

\`\`\`
compiler-lens/
├── docs/
│   ├── ARCHITECTURE.md       # Architectural blueprints & Mermaid diagrams
│   ├── GRAMMAR.md            # MiniLang EBNF formal grammar & precedence
│   ├── PROJECT_REPORT.md     # University submission project report
│   ├── TEST_REPORT.md        # Comprehensive unit & E2E test metrics
│   └── lighthouse-report.md  # Lighthouse performance & accessibility audit
├── public/
│   ├── manifest.json         # PWA Manifest
│   └── sw.js                 # Service worker offline caching
├── src/
│   ├── app/
│   │   ├── api/ai/           # Next.js API routes (explain, chat, grammar)
│   │   ├── grammar-lab/      # Formal Grammar Lab page
│   │   ├── learn/            # Interactive Course & Quizzes page
│   │   ├── playground/       # Main CompilerLens Studio workspace
│   │   ├── layout.tsx        # Root layout with fonts & theme
│   │   └── page.tsx          # Landing page
│   ├── compiler/
│   │   ├── ast/nodes.ts      # AST node interfaces & types
│   │   ├── codegen/          # Bytecode, JS, x86-64 ASM, and WAT generators
│   │   ├── grammar-lab/      # FIRST/FOLLOW, LL(1), and Thompson NFA/DFA
│   │   ├── ir/               # Three-Address Code & Control Flow Graph
│   │   ├── lexer/            # Hand-written Lexer & token definitions
│   │   ├── optimizer/        # Constant folding, propagation, CSE, dead code, LICM
│   │   ├── parser/           # Recursive-descent Pratt parser & error recovery
│   │   ├── semantic/         # Scoped symbol table, type checker, analyzer
│   │   └── vm/               # Stack virtual machine with step player
│   ├── components/
│   │   ├── editor/           # Monaco editor integration
│   │   ├── layout/           # Resizable panel layouts
│   │   ├── panels/           # Individual compiler phase visualization panels
│   │   └── ui/               # Design system primitives & StepPlayer
│   └── lib/
│       ├── ai/               # Offline rule-based diagnostic explainer
│       ├── store/            # Zustand compiler and learning stores
│       └── worker/           # Comlink compiler pipeline worker
└── tests/
    ├── unit/                 # Unit tests — 129 tests, all passing (verified by npm test)
    └── e2e/                  # Playwright end-to-end test suite
\`\`\`

---

## 📜 License
MIT License. Built for educational and research use.
