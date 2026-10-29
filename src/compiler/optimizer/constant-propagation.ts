import { TACInstruction, Operand, constant } from "../ir/tac";

export class ConstantPropagation {
  public static optimize(instructions: TACInstruction[]): {
    instructions: TACInstruction[];
    changesCount: number;
  } {
    let changesCount = 0;
    const result: TACInstruction[] = [];
    const constMap = new Map<string, Operand>();

    for (const inst of instructions) {
      // Labels and jumps invalidate or reset variable constant knowledge
      if (
        inst.kind === "LABEL" ||
        inst.kind === "JUMP" ||
        inst.kind === "JUMP_IF" ||
        inst.kind === "JUMP_IF_FALSE" ||
        inst.kind === "CALL"
      ) {
        // Clear all non-temporary variables across control flow boundaries
        for (const [key, op] of constMap.entries()) {
          if (!key.startsWith("t")) {
            constMap.delete(key);
          }
        }
      }

      // Replace operands if they have a known constant mapping
      const cloned = this.propagateInInstruction(inst, constMap);
      if (cloned.changed) {
        changesCount++;
      }

      // Record new constant assignments
      if (cloned.instruction.kind === "ASSIGN") {
        const destKey = String(cloned.instruction.dest.value);
        if (cloned.instruction.src.kind === "constant") {
          constMap.set(destKey, cloned.instruction.src);
        } else {
          constMap.delete(destKey);
        }
      } else if (
        cloned.instruction.kind === "BINARY" ||
        cloned.instruction.kind === "UNARY"
      ) {
        const destKey = String(cloned.instruction.dest.value);
        constMap.delete(destKey);
      }

      result.push(cloned.instruction);
    }

    return { instructions: result, changesCount };
  }

  private static propagateInInstruction(
    inst: TACInstruction,
    constMap: Map<string, Operand>
  ): { instruction: TACInstruction; changed: boolean } {
    let changed = false;

    const replaceOp = (op: Operand): Operand => {
      const key = String(op.value);
      if (op.kind !== "constant" && constMap.has(key)) {
        changed = true;
        return constMap.get(key)!;
      }
      return op;
    };

    switch (inst.kind) {
      case "ASSIGN":
        return {
          instruction: {
            kind: "ASSIGN",
            dest: inst.dest,
            src: replaceOp(inst.src),
          },
          changed,
        };

      case "BINARY":
        return {
          instruction: {
            kind: "BINARY",
            dest: inst.dest,
            op: inst.op,
            left: replaceOp(inst.left),
            right: replaceOp(inst.right),
          },
          changed,
        };

      case "UNARY":
        return {
          instruction: {
            kind: "UNARY",
            dest: inst.dest,
            op: inst.op,
            src: replaceOp(inst.src),
          },
          changed,
        };

      case "JUMP_IF":
        return {
          instruction: {
            kind: "JUMP_IF",
            condition: replaceOp(inst.condition),
            target: inst.target,
          },
          changed,
        };

      case "JUMP_IF_FALSE":
        return {
          instruction: {
            kind: "JUMP_IF_FALSE",
            condition: replaceOp(inst.condition),
            target: inst.target,
          },
          changed,
        };

      case "PARAM":
        return {
          instruction: {
            kind: "PARAM",
            arg: replaceOp(inst.arg),
          },
          changed,
        };

      case "RETURN":
        return {
          instruction: {
            kind: "RETURN",
            value: inst.value ? replaceOp(inst.value) : undefined,
          },
          changed,
        };

      case "PRINT":
        return {
          instruction: {
            kind: "PRINT",
            args: inst.args.map(replaceOp),
          },
          changed,
        };

      default:
        return { instruction: inst, changed: false };
    }
  }
}
