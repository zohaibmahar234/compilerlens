import { TACInstruction, Operand, formatOperand } from "../ir/tac";

export class CommonSubexpressionElimination {
  public static optimize(instructions: TACInstruction[]): {
    instructions: TACInstruction[];
    changesCount: number;
  } {
    let changesCount = 0;
    const result: TACInstruction[] = [];

    // Map of "op:left:right" -> dest Operand
    let exprMap = new Map<string, Operand>();

    for (const inst of instructions) {
      // Boundaries reset available subexpressions
      if (
        inst.kind === "LABEL" ||
        inst.kind === "JUMP" ||
        inst.kind === "JUMP_IF" ||
        inst.kind === "JUMP_IF_FALSE" ||
        inst.kind === "CALL"
      ) {
        exprMap.clear();
      }

      if (inst.kind === "BINARY") {
        const key = `${inst.op}:${formatOperand(inst.left)}:${formatOperand(inst.right)}`;

        if (exprMap.has(key)) {
          // Found common subexpression! Replace with assign from previous dest
          const existingDest = exprMap.get(key)!;
          changesCount++;
          result.push({
            kind: "ASSIGN",
            dest: inst.dest,
            src: existingDest,
          });
          continue;
        } else {
          exprMap.set(key, inst.dest);
        }
      }

      // If dest variable is redefined, invalidate any subexpressions containing dest
      if (
        inst.kind === "ASSIGN" ||
        inst.kind === "BINARY" ||
        inst.kind === "UNARY"
      ) {
        const destStr = formatOperand(inst.dest);
        for (const [key] of exprMap.entries()) {
          const parts = key.split(":");
          if (parts[1] === destStr || parts[2] === destStr) {
            exprMap.delete(key);
          }
        }
      }

      result.push(inst);
    }

    return { instructions: result, changesCount };
  }
}
