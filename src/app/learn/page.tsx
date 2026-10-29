"use client";

import React, { useState } from "react";
import { useLearnStore, Lesson } from "@/lib/store/learn-store";
import {
  BookOpen,
  Award,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const LESSONS: Lesson[] = [
  {
    id: "lexical-analysis",
    title: "01. Lexical Analysis & Tokenization",
    category: "Frontend",
    duration: "10 mins",
    badge: "Lexer Virtuoso",
    content: `### What is Lexical Analysis?
The **Lexer** (or scanner) is the initial phase of the compiler pipeline. Its objective is to transform raw characters into a sequence of meaningful tokens, stripping away whitespace and comments.

\`\`\`
Source:  "int count = 10;"
Stream:  [INT, IDENTIFIER("count"), ASSIGN, INT_LITERAL(10), SEMICOLON]
\`\`\`

### Key Responsibilities:
1. **Regular Expressions**: Define pattern sets for Identifiers (\`[a-zA-Z_][a-zA-Z0-9_]*\`), Numbers (\`[0-9]+\`), and Strings.
2. **Span Tracking**: Preserves exact start and end coordinates (line, column, character offset) for downstream error diagnostics.
3. **Keyword Resolution**: Checks identifier strings against reserved keyword hash maps (e.g., \`function\`, \`if\`, \`while\`).`,
    quiz: [
      {
        id: "q1_1",
        question: "Which of the following formal models is most commonly used by lexers to recognize tokens?",
        options: [
          "Pushdown Automata (PDA)",
          "Deterministic Finite Automata (DFA)",
          "Turing Machines",
          "Linear Bounded Automata",
        ],
        correctAnswer: 1,
        explanation:
          "Regular languages recognized by DFAs are optimal for linear time token recognition.",
      },
      {
        id: "q1_2",
        question: "Why does the lexer record source spans (line and column numbers)?",
        options: [
          "To speed up code execution in the VM",
          "To enable precise compiler error messages and IDE highlight correlation",
          "To compress token storage in memory",
          "To compute bytecode jumps",
        ],
        correctAnswer: 1,
        explanation:
          "Accurate line/column tracking enables helpful error reporting and editor underlines.",
      },
    ],
  },
  {
    id: "syntax-analysis",
    title: "02. Syntax Analysis & AST Construction",
    category: "Frontend",
    duration: "15 mins",
    badge: "Syntax Architect",
    content: `### What is Syntax Analysis?
The **Parser** checks if the token stream conforms to the formal context-free grammar of the programming language and builds a tree structure called the **Abstract Syntax Tree (AST)**.

### Parsing Paradigms:
- **Top-Down (LL)**: Constructs trees from root to leaves (e.g. Recursive Descent, Pratt Precedence Climbing).
- **Bottom-Up (LR)**: Shifts tokens and reduces according to production rules (e.g. SLR, LALR).

### Handling Precedence:
Pratt parsing binds operators according to binding power levels, ensuring that expressions like \`2 + 3 * 4\` evaluate multiplication before addition.`,
    quiz: [
      {
        id: "q2_1",
        question: "What differentiates an Abstract Syntax Tree (AST) from a Parse Tree (CST)?",
        options: [
          "ASTs contain only binary trees",
          "ASTs omit punctuation and structural noise (such as parentheses and semicolons), retaining semantic essence",
          "Parse trees contain bytecode instructions",
          "ASTs are generated after code generation",
        ],
        correctAnswer: 1,
        explanation:
          "The AST distills syntax into pure programmatic operations, eliminating grammatical boilerplate.",
      },
      {
        id: "q2_2",
        question: "Why does immediate left recursion (e.g., E -> E + T) cause failure in recursive descent parsers?",
        options: [
          "It triggers an infinite recursive call loop without consuming any tokens",
          "It produces memory leaks in the symbol table",
          "It forces the parser to switch to LR parsing",
          "It makes tokens invalid",
        ],
        correctAnswer: 0,
        explanation:
          "A non-terminal immediately calling itself without consuming a token causes infinite stack overflow.",
      },
    ],
  },
  {
    id: "semantic-analysis",
    title: "03. Semantic Analysis & Scoping",
    category: "Middle-End",
    duration: "12 mins",
    badge: "Type Master",
    content: `### Beyond Syntax: Meaning & Consistency
A program can be syntactically valid yet semantically nonsensical (e.g., adding a string to a boolean or using an undeclared variable).

### Key Responsibilities:
1. **Symbol Table**: Tracks identifier names, types, scopes, and memory offsets.
2. **Scope Resolution**: Implements static block scoping with support for inner shadowing.
3. **Type Checking**: Ensures operators receive compatible operands and validates function argument types and return values.
4. **Deterministic Returns**: Verifies that non-void functions return along all deterministic control flow branches.`,
    quiz: [
      {
        id: "q3_1",
        question: "What data structure typically represents nested lexical scopes in a compiler?",
        options: [
          "A single flat array",
          "A tree of symbol tables with parent pointers",
          "A circular queue",
          "A binary search tree without parent links",
        ],
        correctAnswer: 1,
        explanation:
          "A scope tree allows an identifier lookup to walk up the parent chain until the global scope.",
      },
    ],
  },
  {
    id: "intermediate-representation",
    title: "04. Three-Address Code & Control Flow Graphs",
    category: "Middle-End",
    duration: "15 mins",
    badge: "IR Engineer",
    content: `### Linearizing Expressions
**Three-Address Code (TAC)** is an Intermediate Representation (IR) where each instruction has at most one operator on the right-hand side.

\`\`\`
MiniLang:   x = a + b * c;
TAC:        t0 = b * c
            t1 = a + t0
            x = t1
\`\`\`

### Basic Blocks & CFG:
1. **Leader Identification**: The first instruction, any jump target label, or instruction following a jump is a leader.
2. **Basic Block**: A maximal sequence of consecutive instructions with single-entry, single-exit execution.
3. **Edges**: Represent transfer of control (conditional jumps, unconditional gotos, fallthrough).`,
    quiz: [
      {
        id: "q4_1",
        question: "Why is an Intermediate Representation (IR) advantageous in multi-platform compilers?",
        options: [
          "It reduces compiler build time by 90%",
          "It decouples language frontend analysis from machine-specific code generation backends (M frontends + N backends = M + N instead of M * N)",
          "It eliminates the need for syntax analysis",
          "It makes code interpretation faster than machine code",
        ],
        correctAnswer: 1,
        explanation:
          "IR decouples frontends from backends, enabling retargetability across diverse CPU architectures.",
      },
    ],
  },
  {
    id: "optimization",
    title: "05. Compiler Optimization Algorithms",
    category: "Optimization",
    duration: "20 mins",
    badge: "Optimization Wizard",
    content: `### Making Code Smaller & Faster
Optimizations transform IR into equivalent code that executes faster or consumes less memory.

### Classic Passes:
- **Constant Folding**: Precomputes constants at compile time (\`2 * 1024 -> 2048\`).
- **Constant Propagation**: Replaces variables with their known constant values.
- **Algebraic Simplification**: Uses identities like \`x + 0 -> x\` or \`x * 0 -> 0\`.
- **Common Subexpression Elimination (CSE)**: Reuses computed values instead of recalculating identical expressions.
- **Dead Code Elimination**: Prunes unused variables and unreachable branches.
- **Loop Invariant Code Motion (LICM)**: Hoists invariant calculations outside loop headers.`,
    quiz: [
      {
        id: "q5_1",
        question: "What transformation is performed when replacing 'x = y + 0' with 'x = y'?",
        options: [
          "Loop Unrolling",
          "Algebraic Simplification / Identity Reduction",
          "Register Spilling",
          "Inlining",
        ],
        correctAnswer: 1,
        explanation:
          "Algebraic properties of arithmetic allow simplifying operations with neutral identity elements.",
      },
    ],
  },
  {
    id: "virtual-machines",
    title: "06. Bytecode Generation & Stack VMs",
    category: "Backend",
    duration: "15 mins",
    badge: "Runtime Guru",
    content: `### Stack vs Register Machines
- **Stack-based VM** (Java JVM, Python bytecode, CompilerLens MiniLang): Instructions push and pop operands onto an evaluation stack. Highly compact instructions!
- **Register-based VM** (Lua VM, Dalvik): Instructions encode explicit register numbers.

### Execution Cycle:
1. **Fetch**: Read instruction at IP (Instruction Pointer).
2. **Decode**: Determine opcode and operands.
3. **Execute**: Perform arithmetic, jump, load/store, or push call frame.
4. **Advance**: Increment IP to next address.`,
    quiz: [
      {
        id: "q6_1",
        question: "In a stack-based VM, what are the contents of the stack after executing: PUSH 5; PUSH 3; SUB?",
        options: ["8", "-2", "2", "3, 5"],
        correctAnswer: 2,
        explanation:
          "5 is pushed, then 3 is pushed. SUB pops b=3 and a=5, computing 5 - 3 = 2 and pushes 2.",
      },
    ],
  },
];

export default function LearnPage() {
  const {
    completedLessons,
    quizScores,
    unlockedBadges,
    activeLessonId,
    setActiveLesson,
    completeLesson,
    resetProgress,
  } = useLearnStore();

  const activeLesson = LESSONS.find((l) => l.id === activeLessonId) || LESSONS[0];

  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);

  const handleSelectOption = (qId: string, optIdx: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optIdx }));
  };

  const handleGradeQuiz = () => {
    let correct = 0;
    for (const q of activeLesson.quiz) {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        correct++;
      }
    }
    const scorePct = Math.round((correct / activeLesson.quiz.length) * 100);
    completeLesson(activeLesson.id, scorePct, activeLesson.badge);
    setShowResults(true);
  };

  return (
    <div className="container max-w-7xl py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-2">
            <BookOpen className="h-3.5 w-3.5" /> Compiler Engineering Curriculum
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Interactive Course & Quizzes</h1>
        </div>

        {/* Badges Earned */}
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground mr-1">Badges Earned:</div>
          {unlockedBadges.length === 0 ? (
            <span className="text-xs text-muted-foreground italic">None yet</span>
          ) : (
            unlockedBadges.map((b) => (
              <span
                key={b}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold"
              >
                <Award className="h-3.5 w-3.5" /> {b}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">
            Course Modules ({completedLessons.length}/{LESSONS.length} Complete)
          </div>

          {LESSONS.map((l) => {
            const isCompleted = completedLessons.includes(l.id);
            const isSelected = activeLessonId === l.id;

            return (
              <div
                key={l.id}
                onClick={() => {
                  setActiveLesson(l.id);
                  setSelectedAnswers({});
                  setShowResults(false);
                }}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? "border-primary bg-primary/10 text-primary-foreground shadow-sm"
                    : "border-border/60 bg-card/60 hover:bg-muted/40 text-foreground"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-foreground">{l.title}</span>
                  {isCompleted && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                </div>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                  <span>{l.category}</span>
                  <span>&bull;</span>
                  <span>{l.duration}</span>
                </div>
              </div>
            );
          })}

          <div className="pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={resetProgress}
              className="w-full text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset Progress
            </Button>
          </div>
        </div>

        {/* Content & Quiz Area */}
        <div className="lg:col-span-8 space-y-6">
          {/* Lesson Content Card */}
          <div className="rounded-2xl border border-border/70 bg-card p-6 md:p-8 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <h2 className="text-xl font-bold">{activeLesson.title}</h2>
              <span className="text-xs px-2.5 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary font-semibold">
                Badge: {activeLesson.badge}
              </span>
            </div>

            <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-line text-slate-200">
              {activeLesson.content}
            </div>
          </div>

          {/* Interactive Quiz Card */}
          <div className="rounded-2xl border border-border/70 bg-card p-6 md:p-8 space-y-6 shadow-sm">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">Knowledge Check Quiz</h3>
            </div>

            <div className="space-y-6">
              {activeLesson.quiz.map((q, idx) => (
                <div key={q.id} className="space-y-3 font-sans">
                  <div className="text-sm font-semibold text-foreground">
                    {idx + 1}. {q.question}
                  </div>

                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => {
                      const isChosen = selectedAnswers[q.id] === optIdx;
                      let optionClasses =
                        "border border-border/60 bg-muted/20 hover:bg-muted/40 text-foreground";

                      if (showResults) {
                        if (optIdx === q.correctAnswer) {
                          optionClasses =
                            "border-emerald-500/60 bg-emerald-500/20 text-emerald-300 font-semibold";
                        } else if (isChosen) {
                          optionClasses =
                            "border-rose-500/60 bg-rose-500/20 text-rose-300";
                        }
                      } else if (isChosen) {
                        optionClasses = "border-primary bg-primary/20 text-primary font-semibold";
                      }

                      return (
                        <div
                          key={optIdx}
                          onClick={() => !showResults && handleSelectOption(q.id, optIdx)}
                          className={`p-3 rounded-xl text-xs cursor-pointer transition-colors ${optionClasses}`}
                        >
                          {opt}
                        </div>
                      );
                    })}
                  </div>

                  {showResults && (
                    <div className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border/40">
                      💡 {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border/40">
              {showResults ? (
                <div className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Quiz Complete! Score:{" "}
                  {quizScores[activeLesson.id] ?? 100}%
                </div>
              ) : (
                <Button
                  onClick={handleGradeQuiz}
                  disabled={
                    Object.keys(selectedAnswers).length < activeLesson.quiz.length
                  }
                  className="text-xs"
                >
                  Grade Quiz & Claim Badge
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
