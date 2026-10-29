import { BinaryOperator, UnaryOperator, MiniLangType } from "../ast/nodes";

export type OperandKind = "variable" | "temporary" | "constant" | "label";

export interface Operand {
  kind: OperandKind;
  value: string | number | boolean;
  type?: MiniLangType;
}

export function variable(name: string, type?: MiniLangType): Operand {
  return { kind: "variable", value: name, type };
}

export function temporary(id: number, type?: MiniLangType): Operand {
  return { kind: "temporary", value: `t${id}`, type };
}

export function constant(
  value: string | number | boolean,
  type: MiniLangType
): Operand {
  return { kind: "constant", value, type };
}

export function label(name: string): Operand {
  return { kind: "label", value: name };
}

export type TACInstruction =
  | { kind: "ASSIGN"; dest: Operand; src: Operand }
  | { kind: "BINARY"; dest: Operand; op: BinaryOperator; left: Operand; right: Operand }
  | { kind: "UNARY"; dest: Operand; op: UnaryOperator; src: Operand }
  | { kind: "LABEL"; name: string }
  | { kind: "JUMP"; target: string }
  | { kind: "JUMP_IF"; condition: Operand; target: string }
  | { kind: "JUMP_IF_FALSE"; condition: Operand; target: string }
  | { kind: "PARAM"; arg: Operand }
  | { kind: "CALL"; dest?: Operand; func: string; argCount: number }
  | { kind: "RETURN"; value?: Operand }
  | { kind: "PRINT"; args: Operand[] };

export function formatOperand(op?: Operand): string {
  if (!op) return "";
  if (op.kind === "constant") {
    if (typeof op.value === "string") return `"${op.value}"`;
    return String(op.value);
  }
  return String(op.value);
}

export function formatInstruction(inst: TACInstruction): string {
  switch (inst.kind) {
    case "ASSIGN":
      return `${formatOperand(inst.dest)} = ${formatOperand(inst.src)}`;
    case "BINARY":
      return `${formatOperand(inst.dest)} = ${formatOperand(inst.left)} ${inst.op} ${formatOperand(inst.right)}`;
    case "UNARY":
      return `${formatOperand(inst.dest)} = ${inst.op}${formatOperand(inst.src)}`;
    case "LABEL":
      return `label ${inst.name}:`;
    case "JUMP":
      return `goto ${inst.target}`;
    case "JUMP_IF":
      return `if ${formatOperand(inst.condition)} goto ${inst.target}`;
    case "JUMP_IF_FALSE":
      return `ifFalse ${formatOperand(inst.condition)} goto ${inst.target}`;
    case "PARAM":
      return `param ${formatOperand(inst.arg)}`;
    case "CALL":
      if (inst.dest) {
        return `${formatOperand(inst.dest)} = call ${inst.func}, ${inst.argCount}`;
      }
      return `call ${inst.func}, ${inst.argCount}`;
    case "RETURN":
      if (inst.value) {
        return `return ${formatOperand(inst.value)}`;
      }
      return "return";
    case "PRINT":
      return `print ${inst.args.map(formatOperand).join(", ")}`;
  }
}

export interface TACProgram {
  instructions: TACInstruction[];
}
