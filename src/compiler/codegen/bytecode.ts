export enum Opcode {
  PUSH_INT = "PUSH_INT",
  PUSH_FLOAT = "PUSH_FLOAT",
  PUSH_BOOL = "PUSH_BOOL",
  PUSH_STR = "PUSH_STR",

  LOAD = "LOAD",
  STORE = "STORE",

  ADD = "ADD",
  SUB = "SUB",
  MUL = "MUL",
  DIV = "DIV",
  MOD = "MOD",

  EQ = "EQ",
  NEQ = "NEQ",
  LT = "LT",
  LTE = "LTE",
  GT = "GT",
  GTE = "GTE",

  NOT = "NOT",
  NEG = "NEG",

  AND = "AND",
  OR = "OR",

  JMP = "JMP",
  JMP_IF_TRUE = "JMP_IF_TRUE",
  JMP_IF_FALSE = "JMP_IF_FALSE",

  CALL = "CALL",
  RET = "RET",
  PRINT = "PRINT",
  POP = "POP",
  DUP = "DUP",
  HALT = "HALT",
}

export interface BytecodeInstruction {
  address: number;
  opcode: Opcode;
  operand?: any;
  operand2?: any;
  comment?: string;
}

export function disassembleInstruction(inst: BytecodeInstruction): string {
  const addr = String(inst.address).padStart(4, "0");
  const op = inst.opcode.padEnd(14, " ");

  let operands = "";
  if (inst.operand !== undefined && inst.operand2 !== undefined) {
    operands = `${inst.operand}, ${inst.operand2}`;
  } else if (inst.operand !== undefined) {
    if (typeof inst.operand === "string" && inst.opcode === Opcode.PUSH_STR) {
      operands = `"${inst.operand}"`;
    } else {
      operands = String(inst.operand);
    }
  }

  const comment = inst.comment ? ` ; ${inst.comment}` : "";
  return `${addr}: ${op} ${operands}${comment}`.trimEnd();
}
