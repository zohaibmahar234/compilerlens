import { TACInstruction, Operand, constant } from "../ir/tac";

export class AlgebraicSimplification {
  public static optimize(instructions: TACInstruction[]): {
    instructions: TACInstruction[];
    changesCount: number;
  } {
    let changesCount = 0;
    const result: TACInstruction[] = [];

    for (const inst of instructions) {
      if (inst.kind === "BINARY") {
        const simplified = this.simplifyBinary(
          inst.dest,
          inst.op,
          inst.left,
          inst.right
        );
        if (simplified) {
          changesCount++;
          result.push(simplified);
          continue;
        }
      }
      result.push(inst);
    }

    return { instructions: result, changesCount };
  }

  private static simplifyBinary(
    dest: Operand,
    op: string,
    left: Operand,
    right: Operand
  ): TACInstruction | null {
    const isZero = (o: Operand) => o.kind === "constant" && o.value === 0;
    const isOne = (o: Operand) => o.kind === "constant" && o.value === 1;
    const isTrue = (o: Operand) => o.kind === "constant" && o.value === true;
    const isFalse = (o: Operand) => o.kind === "constant" && o.value === false;

    // Addition
    if (op === "+") {
      if (isZero(right)) return { kind: "ASSIGN", dest, src: left };
      if (isZero(left)) return { kind: "ASSIGN", dest, src: right };
    }

    // Subtraction
    if (op === "-") {
      if (isZero(right)) return { kind: "ASSIGN", dest, src: left };
    }

    // Multiplication
    if (op === "*") {
      if (isOne(right)) return { kind: "ASSIGN", dest, src: left };
      if (isOne(left)) return { kind: "ASSIGN", dest, src: right };
      if (isZero(right)) return { kind: "ASSIGN", dest, src: constant(0, "int") };
      if (isZero(left)) return { kind: "ASSIGN", dest, src: constant(0, "int") };
    }

    // Division
    if (op === "/") {
      if (isOne(right)) return { kind: "ASSIGN", dest, src: left };
    }

    // Logical AND
    if (op === "&&") {
      if (isTrue(right)) return { kind: "ASSIGN", dest, src: left };
      if (isTrue(left)) return { kind: "ASSIGN", dest, src: right };
      if (isFalse(right)) return { kind: "ASSIGN", dest, src: constant(false, "bool") };
      if (isFalse(left)) return { kind: "ASSIGN", dest, src: constant(false, "bool") };
    }

    // Logical OR
    if (op === "||") {
      if (isFalse(right)) return { kind: "ASSIGN", dest, src: left };
      if (isFalse(left)) return { kind: "ASSIGN", dest, src: right };
      if (isTrue(right)) return { kind: "ASSIGN", dest, src: constant(true, "bool") };
      if (isTrue(left)) return { kind: "ASSIGN", dest, src: constant(true, "bool") };
    }

    return null;
  }
}
