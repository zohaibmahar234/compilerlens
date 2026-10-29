import { describe, it, expect } from "vitest";
import { Lexer } from "../../src/compiler/lexer/lexer";
import { Parser } from "../../src/compiler/parser/parser";
import { TACGenerator } from "../../src/compiler/ir/ir-gen";
import { ControlFlowGraph } from "../../src/compiler/ir/cfg";
import { ConstantFolding } from "../../src/compiler/optimizer/constant-folding";
import { ConstantPropagation } from "../../src/compiler/optimizer/constant-propagation";
import { AlgebraicSimplification } from "../../src/compiler/optimizer/algebraic";
import { CommonSubexpressionElimination } from "../../src/compiler/optimizer/cse";
import { DeadCodeElimination } from "../../src/compiler/optimizer/dead-code";
import { LoopInvariantCodeMotion } from "../../src/compiler/optimizer/loop-invariant";
import { Optimizer } from "../../src/compiler/optimizer/optimizer";
import {
  TACInstruction,
  variable,
  temporary,
  constant,
  formatInstruction,
} from "../../src/compiler/ir/tac";

describe("IR and Optimization Unit Tests", () => {
  const getTAC = (code: string): TACInstruction[] => {
    const lexer = new Lexer(code);
    const { tokens } = lexer.tokenize();
    const parser = new Parser(tokens);
    const { ast } = parser.parse();
    const irGen = new TACGenerator();
    return irGen.generate(ast).instructions;
  };

  // 1-5: TAC Generation
  it("generates TAC for simple variable assignments", () => {
    const code = "int a = 10; int b = a;";
    const tac = getTAC(code);
    expect(tac.length).toBeGreaterThanOrEqual(2);
    expect(tac[0].kind).toBe("ASSIGN");
    expect(formatInstruction(tac[0])).toBe("a = 10");
    expect(formatInstruction(tac[1])).toBe("b = a");
  });

  it("generates TAC for arithmetic binary expressions", () => {
    const code = "int x = 2 + 3 * 4;";
    const tac = getTAC(code);
    const text = tac.map(formatInstruction).join("\n");
    expect(text).toContain("*");
    expect(text).toContain("+");
    expect(text).toContain("x =");
  });

  it("generates TAC for if-else control flow with labels and jumps", () => {
    const code = `
      if (x > 0) {
        y = 1;
      } else {
        y = 2;
      }
    `;
    const tac = getTAC(code);
    const kinds = tac.map((i) => i.kind);
    expect(kinds).toContain("JUMP_IF_FALSE");
    expect(kinds).toContain("LABEL");
    expect(kinds).toContain("JUMP");
  });

  it("generates TAC for while loop with backward jump", () => {
    const code = `
      while (i < 5) {
        i = i + 1;
      }
    `;
    const tac = getTAC(code);
    const jumps = tac.filter((i) => i.kind === "JUMP");
    expect(jumps.length).toBeGreaterThanOrEqual(1);
  });

  it("generates TAC for function declaration and calls with parameters", () => {
    const code = `
      function int add(int a, int b) {
        return a + b;
      }
      int ans = add(10, 20);
    `;
    const tac = getTAC(code);
    const text = tac.map(formatInstruction).join("\n");
    expect(text).toContain("label add:");
    expect(text).toContain("param 10");
    expect(text).toContain("param 20");
    expect(text).toContain("call add, 2");
  });

  // 6-8: Short-circuiting TAC
  it("generates short-circuit logic for logical AND", () => {
    const code = "bool res = a && b;";
    const tac = getTAC(code);
    const kinds = tac.map((i) => i.kind);
    expect(kinds).toContain("JUMP_IF_FALSE");
    expect(kinds).toContain("LABEL");
  });

  it("generates short-circuit logic for logical OR", () => {
    const code = "bool res = a || b;";
    const tac = getTAC(code);
    const kinds = tac.map((i) => i.kind);
    expect(kinds).toContain("JUMP_IF");
    expect(kinds).toContain("LABEL");
  });

  it("generates recursive factorial TAC correctly", () => {
    const code = `
      function int factorial(int n) {
        if (n <= 1) {
          return 1;
        }
        return n * factorial(n - 1);
      }
    `;
    const tac = getTAC(code);
    const text = tac.map(formatInstruction).join("\n");
    expect(text).toContain("label factorial:");
    expect(text).toContain("call factorial, 1");
  });

  // 9-12: Control Flow Graph (CFG)
  it("builds CFG basic blocks with leader analysis", () => {
    const code = `
      int a = 1;
      if (a > 0) {
        a = 2;
      } else {
        a = 3;
      }
      print(a);
    `;
    const tac = getTAC(code);
    const cfg = ControlFlowGraph.build(tac);
    expect(cfg.blocks.size).toBeGreaterThanOrEqual(3);
  });

  it("computes CFG dominators accurately", () => {
    const code = `
      int x = 10;
      if (x > 0) {
        x = x + 1;
      }
      print(x);
    `;
    const tac = getTAC(code);
    const cfg = ControlFlowGraph.build(tac);
    const entryBlock = cfg.blocks.get(cfg.entryBlockId);
    expect(entryBlock?.dominators?.has(cfg.entryBlockId)).toBe(true);
  });

  it("generates React Flow compatible node and edge structures", () => {
    const code = "int a = 1; int b = 2;";
    const tac = getTAC(code);
    const cfg = ControlFlowGraph.build(tac);
    const { nodes, edges } = cfg.toReactFlow();
    expect(nodes.length).toBeGreaterThan(0);
    expect(nodes[0].data.code.length).toBeGreaterThan(0);
  });

  // 13-17: Constant Folding
  it("folds binary arithmetic on constants", () => {
    const insts: TACInstruction[] = [
      {
        kind: "BINARY",
        dest: temporary(0),
        op: "+",
        left: constant(2, "int"),
        right: constant(3, "int"),
      },
      {
        kind: "BINARY",
        dest: temporary(1),
        op: "*",
        left: constant(4, "int"),
        right: constant(5, "int"),
      },
    ];
    const { instructions, changesCount } = ConstantFolding.optimize(insts);
    expect(changesCount).toBe(2);
    expect(instructions[0].kind).toBe("ASSIGN");
    expect((instructions[0] as any).src.value).toBe(5);
    expect((instructions[1] as any).src.value).toBe(20);
  });

  it("folds relational and equality comparisons on constants", () => {
    const insts: TACInstruction[] = [
      {
        kind: "BINARY",
        dest: temporary(0),
        op: "<",
        left: constant(10, "int"),
        right: constant(20, "int"),
      },
      {
        kind: "BINARY",
        dest: temporary(1),
        op: "==",
        left: constant(5, "int"),
        right: constant(5, "int"),
      },
    ];
    const { instructions } = ConstantFolding.optimize(insts);
    expect((instructions[0] as any).src.value).toBe(true);
    expect((instructions[1] as any).src.value).toBe(true);
  });

  it("folds unary negation and NOT on constants", () => {
    const insts: TACInstruction[] = [
      {
        kind: "UNARY",
        dest: temporary(0),
        op: "-",
        src: constant(42, "int"),
      },
      {
        kind: "UNARY",
        dest: temporary(1),
        op: "!",
        src: constant(true, "bool"),
      },
    ];
    const { instructions } = ConstantFolding.optimize(insts);
    expect((instructions[0] as any).src.value).toBe(-42);
    expect((instructions[1] as any).src.value).toBe(false);
  });

  it("folds constant conditional jumps", () => {
    const insts: TACInstruction[] = [
      {
        kind: "JUMP_IF_FALSE",
        condition: constant(false, "bool"),
        target: "L_target",
      },
    ];
    const { instructions } = ConstantFolding.optimize(insts);
    expect(instructions[0].kind).toBe("JUMP");
    expect((instructions[0] as any).target).toBe("L_target");
  });

  // 18-20: Constant Propagation
  it("propagates known constants to subsequent usages", () => {
    const insts: TACInstruction[] = [
      {
        kind: "ASSIGN",
        dest: variable("x"),
        src: constant(10, "int"),
      },
      {
        kind: "BINARY",
        dest: temporary(0),
        op: "+",
        left: variable("x"),
        right: constant(5, "int"),
      },
    ];
    const { instructions, changesCount } = ConstantPropagation.optimize(insts);
    expect(changesCount).toBe(1);
    const bin = instructions[1] as any;
    expect(bin.left.kind).toBe("constant");
    expect(bin.left.value).toBe(10);
  });

  it("invalidates variable constant knowledge across control flow boundaries", () => {
    const insts: TACInstruction[] = [
      { kind: "ASSIGN", dest: variable("x"), src: constant(10, "int") },
      { kind: "LABEL", name: "loop_head" },
      {
        kind: "BINARY",
        dest: temporary(0),
        op: "+",
        left: variable("x"),
        right: constant(1, "int"),
      },
    ];
    const { instructions } = ConstantPropagation.optimize(insts);
    const bin = instructions[2] as any;
    expect(bin.left.kind).toBe("variable"); // not propagated across label
  });

  // 21-25: Algebraic Simplifications
  it("simplifies addition with zero: x + 0 -> x", () => {
    const insts: TACInstruction[] = [
      {
        kind: "BINARY",
        dest: temporary(0),
        op: "+",
        left: variable("x"),
        right: constant(0, "int"),
      },
    ];
    const { instructions, changesCount } = AlgebraicSimplification.optimize(insts);
    expect(changesCount).toBe(1);
    expect(instructions[0].kind).toBe("ASSIGN");
    expect((instructions[0] as any).src.value).toBe("x");
  });

  it("simplifies multiplication with one: x * 1 -> x", () => {
    const insts: TACInstruction[] = [
      {
        kind: "BINARY",
        dest: temporary(0),
        op: "*",
        left: variable("x"),
        right: constant(1, "int"),
      },
    ];
    const { instructions } = AlgebraicSimplification.optimize(insts);
    expect(instructions[0].kind).toBe("ASSIGN");
    expect((instructions[0] as any).src.value).toBe("x");
  });

  it("simplifies multiplication with zero: x * 0 -> 0", () => {
    const insts: TACInstruction[] = [
      {
        kind: "BINARY",
        dest: temporary(0),
        op: "*",
        left: variable("x"),
        right: constant(0, "int"),
      },
    ];
    const { instructions } = AlgebraicSimplification.optimize(insts);
    expect((instructions[0] as any).src.value).toBe(0);
  });

  it("simplifies division by one: x / 1 -> x", () => {
    const insts: TACInstruction[] = [
      {
        kind: "BINARY",
        dest: temporary(0),
        op: "/",
        left: variable("x"),
        right: constant(1, "int"),
      },
    ];
    const { instructions } = AlgebraicSimplification.optimize(insts);
    expect((instructions[0] as any).src.value).toBe("x");
  });

  it("simplifies logical identities: x && true -> x, x || false -> x", () => {
    const insts: TACInstruction[] = [
      {
        kind: "BINARY",
        dest: temporary(0),
        op: "&&",
        left: variable("flag"),
        right: constant(true, "bool"),
      },
      {
        kind: "BINARY",
        dest: temporary(1),
        op: "||",
        left: variable("flag"),
        right: constant(false, "bool"),
      },
    ];
    const { instructions } = AlgebraicSimplification.optimize(insts);
    expect((instructions[0] as any).src.value).toBe("flag");
    expect((instructions[1] as any).src.value).toBe("flag");
  });

  // 26-28: Common Subexpression Elimination (CSE)
  it("eliminates common subexpressions in basic blocks", () => {
    const insts: TACInstruction[] = [
      {
        kind: "BINARY",
        dest: temporary(0),
        op: "+",
        left: variable("a"),
        right: variable("b"),
      },
      {
        kind: "BINARY",
        dest: temporary(1),
        op: "+",
        left: variable("a"),
        right: variable("b"),
      },
    ];
    const { instructions, changesCount } =
      CommonSubexpressionElimination.optimize(insts);
    expect(changesCount).toBe(1);
    expect(instructions[1].kind).toBe("ASSIGN");
    expect((instructions[1] as any).src.value).toBe("t0");
  });

  // 29-30: Dead Code Elimination
  it("eliminates unused temporary instructions", () => {
    const insts: TACInstruction[] = [
      {
        kind: "BINARY",
        dest: temporary(99), // never read anywhere
        op: "+",
        left: constant(1, "int"),
        right: constant(2, "int"),
      },
      {
        kind: "PRINT",
        args: [constant(100, "int")],
      },
    ];
    const { instructions, changesCount } = DeadCodeElimination.optimize(insts);
    expect(changesCount).toBe(1);
    expect(instructions.length).toBe(1);
    expect(instructions[0].kind).toBe("PRINT");
  });

  it("eliminates unreachable code after unconditional jumps", () => {
    const insts: TACInstruction[] = [
      { kind: "JUMP", target: "L_end" },
      {
        kind: "ASSIGN",
        dest: variable("unreachable"),
        src: constant(1, "int"),
      },
      { kind: "LABEL", name: "L_end" },
      { kind: "PRINT", args: [constant(0, "int")] },
    ];
    const { instructions } = DeadCodeElimination.optimize(insts);
    expect(instructions.some((i) => (i as any).dest?.value === "unreachable")).toBe(
      false
    );
  });

  // 31-32: Loop Invariant Code Motion & Full Optimizer
  it("hoists loop invariant computation out of loop", () => {
    const insts: TACInstruction[] = [
      { kind: "LABEL", name: "loop_start" },
      {
        kind: "BINARY",
        dest: temporary(0),
        op: "*",
        left: variable("width"), // not modified in loop
        right: constant(2, "int"),
      },
      {
        kind: "ASSIGN",
        dest: variable("i"),
        src: temporary(0),
      },
      { kind: "JUMP", target: "loop_start" },
    ];
    const { changesCount } = LoopInvariantCodeMotion.optimize(insts);
    expect(changesCount).toBe(1);
  });

  it("converges multi-pass optimizer pipeline on complex code", () => {
    const code = `
      int a = 10 + 5;
      int b = a * 2;
      int c = b + 0;
      print(c);
    `;
    const tac = getTAC(code);
    const result = Optimizer.optimize(tac);
    expect(result.totalChanges).toBeGreaterThan(0);
    expect(result.passes.length).toBeGreaterThan(0);
  });
});
