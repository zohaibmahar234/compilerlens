import { TACInstruction, constant } from "../ir/tac";

export class ConstantFolding {
  public static optimize(instructions: TACInstruction[]): {
    instructions: TACInstruction[];
    changesCount: number;
  } {
    let changesCount = 0;
    const result: TACInstruction[] = [];

    for (const inst of instructions) {
      if (inst.kind === "BINARY") {
        if (inst.left.kind === "constant" && inst.right.kind === "constant") {
          const lVal = inst.left.value;
          const rVal = inst.right.value;
          const folded = this.foldBinary(inst.op, lVal, rVal);

          if (folded !== null) {
            changesCount++;
            result.push({
              kind: "ASSIGN",
              dest: inst.dest,
              src: constant(folded.value, folded.type),
            });
            continue;
          }
        }
      } else if (inst.kind === "UNARY") {
        if (inst.src.kind === "constant") {
          const val = inst.src.value;
          const folded = this.foldUnary(inst.op, val);

          if (folded !== null) {
            changesCount++;
            result.push({
              kind: "ASSIGN",
              dest: inst.dest,
              src: constant(folded.value, folded.type),
            });
            continue;
          }
        }
      } else if (inst.kind === "JUMP_IF") {
        if (inst.condition.kind === "constant") {
          changesCount++;
          if (Boolean(inst.condition.value)) {
            result.push({ kind: "JUMP", target: inst.target });
          }
          // If condition is false, condition jump never executes, drop it
          continue;
        }
      } else if (inst.kind === "JUMP_IF_FALSE") {
        if (inst.condition.kind === "constant") {
          changesCount++;
          if (!Boolean(inst.condition.value)) {
            result.push({ kind: "JUMP", target: inst.target });
          }
          // If condition is true, ifFalse jump never executes, drop it
          continue;
        }
      }

      result.push(inst);
    }

    return { instructions: result, changesCount };
  }

  private static foldBinary(
    op: string,
    left: any,
    right: any
  ): { value: any; type: "int" | "float" | "bool" | "string" } | null {
    switch (op) {
      case "+":
        if (typeof left === "string" || typeof right === "string") {
          return { value: `${left}${right}`, type: "string" };
        }
        if (typeof left === "number" && typeof right === "number") {
          const val = left + right;
          return { value: val, type: Number.isInteger(val) ? "int" : "float" };
        }
        break;

      case "-":
        if (typeof left === "number" && typeof right === "number") {
          const val = left - right;
          return { value: val, type: Number.isInteger(val) ? "int" : "float" };
        }
        break;

      case "*":
        if (typeof left === "number" && typeof right === "number") {
          const val = left * right;
          return { value: val, type: Number.isInteger(val) ? "int" : "float" };
        }
        break;

      case "/":
        if (typeof left === "number" && typeof right === "number") {
          if (right === 0) return null; // Avoid compile-time div by zero
          const val = left / right;
          return { value: val, type: Number.isInteger(val) ? "int" : "float" };
        }
        break;

      case "%":
        if (typeof left === "number" && typeof right === "number") {
          if (right === 0) return null;
          return { value: left % right, type: "int" };
        }
        break;

      case "==":
        return { value: left === right, type: "bool" };
      case "!=":
        return { value: left !== right, type: "bool" };
      case "<":
        return { value: left < right, type: "bool" };
      case "<=":
        return { value: left <= right, type: "bool" };
      case ">":
        return { value: left > right, type: "bool" };
      case ">=":
        return { value: left >= right, type: "bool" };

      case "&&":
        return { value: Boolean(left) && Boolean(right), type: "bool" };
      case "||":
        return { value: Boolean(left) || Boolean(right), type: "bool" };
    }

    return null;
  }

  private static foldUnary(
    op: string,
    val: any
  ): { value: any; type: "int" | "float" | "bool" } | null {
    if (op === "-") {
      if (typeof val === "number") {
        return { value: -val, type: Number.isInteger(-val) ? "int" : "float" };
      }
    }
    if (op === "!") {
      return { value: !Boolean(val), type: "bool" };
    }
    return null;
  }
}
