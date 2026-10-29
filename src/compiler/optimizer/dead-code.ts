import { TACInstruction, Operand, formatOperand } from "../ir/tac";

export class DeadCodeElimination {
  public static optimize(instructions: TACInstruction[]): {
    instructions: TACInstruction[];
    changesCount: number;
  } {
    let totalChanges = 0;
    let current = instructions;

    // Run until fixpoint or max iterations
    for (let iter = 0; iter < 5; iter++) {
      const pass1 = this.eliminateUnreachableCode(current);
      const pass2 = this.eliminateUnusedAssignments(pass1.instructions);
      const passChanges = pass1.changesCount + pass2.changesCount;
      totalChanges += passChanges;
      current = pass2.instructions;
      if (passChanges === 0) break;
    }

    return { instructions: current, changesCount: totalChanges };
  }

  private static eliminateUnreachableCode(instructions: TACInstruction[]): {
    instructions: TACInstruction[];
    changesCount: number;
  } {
    const result: TACInstruction[] = [];
    let isReachable = true;
    let changesCount = 0;

    for (const inst of instructions) {
      if (inst.kind === "LABEL") {
        isReachable = true; // Labels restore reachability
        result.push(inst);
        continue;
      }

      if (!isReachable) {
        changesCount++;
        continue; // Drop unreachable instruction
      }

      result.push(inst);

      if (inst.kind === "JUMP" || inst.kind === "RETURN") {
        isReachable = false;
      }
    }

    return { instructions: result, changesCount };
  }

  private static eliminateUnusedAssignments(instructions: TACInstruction[]): {
    instructions: TACInstruction[];
    changesCount: number;
  } {
    let changesCount = 0;

    // Collect all read/used operand names
    const used = new Set<string>();

    for (const inst of instructions) {
      const markUsed = (op?: Operand) => {
        if (op && (op.kind === "variable" || op.kind === "temporary")) {
          used.add(String(op.value));
        }
      };

      switch (inst.kind) {
        case "ASSIGN":
          markUsed(inst.src);
          break;
        case "BINARY":
          markUsed(inst.left);
          markUsed(inst.right);
          break;
        case "UNARY":
          markUsed(inst.src);
          break;
        case "JUMP_IF":
        case "JUMP_IF_FALSE":
          markUsed(inst.condition);
          break;
        case "PARAM":
          markUsed(inst.arg);
          break;
        case "RETURN":
          markUsed(inst.value);
          break;
        case "PRINT":
          inst.args.forEach(markUsed);
          break;
        case "CALL":
          // A call may have side effects, so its args are marked
          break;
      }
    }

    const result: TACInstruction[] = [];

    for (const inst of instructions) {
      // Calls have side effects even if return value is unused
      if (inst.kind === "CALL") {
        result.push(inst);
        continue;
      }

      if (
        inst.kind === "ASSIGN" ||
        inst.kind === "BINARY" ||
        inst.kind === "UNARY"
      ) {
        const destName = String(inst.dest.value);
        // Only eliminate unused temporaries or variables not in used set
        if (inst.dest.kind === "temporary" && !used.has(destName)) {
          changesCount++;
          continue; // Eliminate dead assignment
        }
      }

      result.push(inst);
    }

    return { instructions: result, changesCount };
  }
}
