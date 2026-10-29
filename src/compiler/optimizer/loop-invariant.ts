import { TACInstruction, Operand, formatOperand } from "../ir/tac";

export class LoopInvariantCodeMotion {
  public static optimize(instructions: TACInstruction[]): {
    instructions: TACInstruction[];
    changesCount: number;
  } {
    let changesCount = 0;
    const result: TACInstruction[] = [...instructions];

    // Find loop regions: from a label L_start to a jump back to L_start
    for (let i = 0; i < result.length; i++) {
      const inst = result[i];
      if (inst.kind !== "LABEL") continue;

      const loopStartLabel = inst.name;
      // Search for backward jump to loopStartLabel
      let jumpBackIndex = -1;
      for (let j = i + 1; j < result.length; j++) {
        const next = result[j];
        if (next.kind === "JUMP" && next.target === loopStartLabel) {
          jumpBackIndex = j;
          break;
        }
      }

      if (jumpBackIndex === -1) continue;

      // Identify all variables modified within the loop [i, jumpBackIndex]
      const modifiedInLoop = new Set<string>();
      for (let k = i; k <= jumpBackIndex; k++) {
        const loopInst = result[k];
        if (
          loopInst.kind === "ASSIGN" ||
          loopInst.kind === "BINARY" ||
          loopInst.kind === "UNARY"
        ) {
          modifiedInLoop.add(formatOperand(loopInst.dest));
        }
      }

      // Check for candidate invariant instructions within the loop
      const invariantIndices: number[] = [];
      for (let k = i + 1; k < jumpBackIndex; k++) {
        const loopInst = result[k];
        if (loopInst.kind === "BINARY") {
          const isInvariant = (op: Operand) =>
            op.kind === "constant" ||
            (!modifiedInLoop.has(formatOperand(op)) && op.kind !== "temporary");

          if (isInvariant(loopInst.left) && isInvariant(loopInst.right)) {
            invariantIndices.push(k);
          }
        }
      }

      // Hoist invariant instructions to before the loop start label
      if (invariantIndices.length > 0) {
        // Collect instructions
        const hoisted: TACInstruction[] = [];
        for (const idx of invariantIndices) {
          hoisted.push(result[idx]);
          changesCount++;
        }

        // Filter hoisted from the loop
        const newResult: TACInstruction[] = [];
        for (let idx = 0; idx < result.length; idx++) {
          if (idx === i) {
            newResult.push(...hoisted); // Insert before label
          }
          if (!invariantIndices.includes(idx)) {
            newResult.push(result[idx]);
          }
        }
        return { instructions: newResult, changesCount };
      }
    }

    return { instructions: result, changesCount };
  }
}
