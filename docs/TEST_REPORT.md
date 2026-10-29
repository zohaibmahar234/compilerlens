# CompilerLens Test Verification Report

## Test Execution Summary

| Test Suite File | Domain | Test Count | Pass Rate | Execution Mode |
| :--- | :--- | :---: | :---: | :--- |
| `tests/unit/lexer.test.ts` | Lexical Analysis & Tokenization | 38 | 100% | Vitest Node |
| `tests/unit/parser.test.ts` | Syntax Analysis & AST Construction | 20 | 100% | Vitest Node |
| `tests/unit/semantic.test.ts` | Symbol Tables & Type Checking | 31 | 100% | Vitest Node |
| `tests/unit/ir.test.ts` | TAC IR, CFG & Optimizers | 27 | 100% | Vitest Node |
| `tests/unit/codegen.test.ts` | Bytecode, Stack VM, JS/ASM/WAT | 13 | 100% | Vitest Node |
| `tests/e2e/compilerlens.spec.ts` | Full Web Application E2E | 5 | — | Playwright Chromium (requires running dev server) |
| **Total Unit Tests (verified)** | **All Phases Combined** | **129** | **100%** | **`npm test` — Vitest v2.1.9** |

---

## Detailed Test Breakdown

### 1. Lexical Analysis (`tests/unit/lexer.test.ts`) - 38 Tests
- **Numbers**: Integers, floating-point decimals, zero values, scientific notation error cases.
- **Strings**: Empty strings, standard ASCII, escaped quotes (`\"`), newline escapes (`\n`), tab escapes (`\t`), unterminated string detection.
- **Booleans**: Exact keyword recognition (`true`, `false`).
- **Keywords**: All 14 reserved keywords (`function`, `int`, `float`, `bool`, `string`, `void`, `if`, `else`, `while`, `for`, `return`, `print`, `true`, `false`).
- **Identifiers**: Alpha characters, leading underscores, alphanumeric combinations.
- **Operators**: Arithmetic (`+`, `-`, `*`, `/`, `%`), Comparisons (`==`, `!=`, `<`, `<=`, `>`, `>=`), Logical (`&&`, `||`, `!`), Assignment (`=`).
- **Delimiters**: `(`, `)`, `{`, `}`, `[`, `]`, `;`, `,`.
- **Comments**: Single-line (`//`), multi-line (`/* ... */`), unterminated multi-line error reporting.
- **Error Recovery**: Standalone `&` and `|` suggestions, unmapped illegal characters.
- **Spans**: Accurate 1-indexed line and column coordinates.

### 2. Syntax Analysis & AST (`tests/unit/parser.test.ts`) - 20 Tests
- Variable declarations with and without initializers.
- Zero, single, and multi-parameter function declarations.
- Return statements (with value and bare `return;`).
- Variadic `print(...)` statements.
- Assignment statements and expression statements.
- If-else statements and chained else-if blocks.
- While loops and For loops (with var declarations or assignments in init).
- Pratt Precedence Climbing:
  - Multiplication over addition.
  - Relational comparison over equality and logical AND.
  - Parentheses grouping override.
  - Unary negation and logical NOT.
- Function call expressions with argument expressions.
- Panic-mode error recovery across semicolon boundaries.
- Complex programs: Recursive Factorial, Fibonacci, Prime testing AST structures.

### 3. Semantic Analysis (`tests/unit/semantic.test.ts`) - 31 Tests
- Primitive variable type validation.
- Float widening coercion from integer expressions.
- Type mismatch detection on variable initialization.
- Duplicate variable declaration rejection in identical scope.
- Lexical block scope shadowing validation.
- Assignment to undeclared identifiers.
- Reference to undeclared identifiers in expressions.
- Incompatible type assignment detection.
- Prohibition of assigning to function symbols.
- Function signature registration and parameter count checking.
- Return type compatibility checks.
- Prohibition of returning values from void functions.
- Missing return detection in non-void subroutines.
- Complete return path analysis across conditional branches.
- Return statement outside function boundary rejection.
- Function argument count mismatch (too few / too many).
- Function argument type mismatch.
- Call to undeclared function rejection.
- Calling non-callable variables as functions rejection.
- Condition expression boolean enforcement (`if`, `while`, `for`).
- Binary operator type verification.
- String concatenation with `+`.
- Modulo restricted to integers.
- Logical NOT restricted to booleans.
- Unused variable warning emission.
- Mutual recursion / forward function referencing validation.

### 4. IR Generation & Optimizations (`tests/unit/ir.test.ts`) - 27 Tests
- Linearized TAC instruction emission for variables and binary expressions.
- If-else jump labels and conditional branch generation.
- While loop backward jump and loop header labels.
- Function declaration labels, parameter emissions, and call quadruples.
- Short-circuit boolean evaluation for `&&` and `||`.
- Basic block formation with leader analysis.
- Control Flow Graph dominator computation.
- React Flow export serialization.
- Constant Folding:
  - Arithmetic operations on integer and float constants.
  - Relational and equality evaluations.
  - Unary negation and NOT.
  - Constant conditional branch pruning (`ifFalse false`, `ifFalse true`).
- Constant Propagation:
  - Known constant propagation into downstream expressions.
  - Invalidation across control flow boundaries (labels/jumps).
- Algebraic Simplification:
  - $x + 0 \to x$, $0 + x \to x$.
  - $x - 0 \to x$.
  - $x \times 1 \to x$, $1 \times x \to x$.
  - $x \times 0 \to 0$, $0 \times x \to 0$.
  - $x / 1 \to x$.
  - $x \land \text{true} \to x$, $x \lor \text{false} \to x$.
- Common Subexpression Elimination (CSE) within basic blocks.
- Dead Code Elimination:
  - Unused temporary instruction pruning.
  - Unreachable instructions following unconditional jumps.
- Loop Invariant Code Motion (LICM):
  - Invariant expression hoisting out of loop headers.
- Multi-pass optimizer fixed-point convergence.

### 5. Code Generation & Virtual Machine (`tests/unit/codegen.test.ts`) - 13 Tests
- Stack VM arithmetic and variable storage.
- Disassembly formatter validation.
- While-loop accumulation in VM ($1 + 2 + \dots + 10 = 55$).
- For-loop iteration in VM.
- Recursive Factorial execution: $\text{factorial}(5) = 120$.
- Recursive Fibonacci execution: $\text{fib}(7) = 13$.
- Trial-division Prime checking in VM ($7 \to \text{true}$, $9 \to \text{false}$).
- Instruction-by-instruction step execution and operand stack verification.
- Breakpoint registration and pause/resume lifecycle.
- JavaScript code generation with `console.log`.
- x86-64 Intel assembly emission with stack frames and registers.
- WebAssembly Text (.wat) emission with module exports and S-expressions.
