import { TACInstruction, TACProgram, formatOperand } from "../ir/tac";

export class AssemblyGenerator {
  public generate(tacProgram: TACProgram): string {
    const lines: string[] = [
      "; -------------------------------------------------------------",
      "; MiniLang Compiled to x86-64 Assembly (Intel Syntax)",
      "; -------------------------------------------------------------",
      ".intel_syntax noprefix",
      ".global main",
      ".section .text",
      "",
    ];

    const instructions = tacProgram.instructions;

    for (let i = 0; i < instructions.length; i++) {
      const inst = instructions[i];

      switch (inst.kind) {
        case "LABEL":
          lines.push("");
          lines.push(`${inst.name}:`);
          if (inst.name === "main" || !inst.name.startsWith("L")) {
            lines.push("  push rbp");
            lines.push("  mov rbp, rsp");
            lines.push("  sub rsp, 64        ; allocate stack frame");
          }
          break;

        case "ASSIGN":
          if (inst.src.kind === "constant") {
            lines.push(`  mov QWORD PTR [rbp-${this.getOffset(inst.dest)}], ${inst.src.value}`);
          } else {
            lines.push(`  mov rax, QWORD PTR [rbp-${this.getOffset(inst.src)}]`);
            lines.push(`  mov QWORD PTR [rbp-${this.getOffset(inst.dest)}], rax`);
          }
          break;

        case "BINARY":
          lines.push(`  ; ${formatOperand(inst.dest)} = ${formatOperand(inst.left)} ${inst.op} ${formatOperand(inst.right)}`);
          this.loadOperandToReg("rax", inst.left, lines);
          this.loadOperandToReg("rbx", inst.right, lines);

          switch (inst.op) {
            case "+":
              lines.push("  add rax, rbx");
              break;
            case "-":
              lines.push("  sub rax, rbx");
              break;
            case "*":
              lines.push("  imul rax, rbx");
              break;
            case "/":
              lines.push("  cqo");
              lines.push("  idiv rbx");
              break;
            case "%":
              lines.push("  cqo");
              lines.push("  idiv rbx");
              lines.push("  mov rax, rdx"); // remainder
              break;
            case "==":
              lines.push("  cmp rax, rbx");
              lines.push("  sete al");
              lines.push("  movzx rax, al");
              break;
            case "!=":
              lines.push("  cmp rax, rbx");
              lines.push("  setne al");
              lines.push("  movzx rax, al");
              break;
            case "<":
              lines.push("  cmp rax, rbx");
              lines.push("  setl al");
              lines.push("  movzx rax, al");
              break;
            case "<=":
              lines.push("  cmp rax, rbx");
              lines.push("  setle al");
              lines.push("  movzx rax, al");
              break;
            case ">":
              lines.push("  cmp rax, rbx");
              lines.push("  setg al");
              lines.push("  movzx rax, al");
              break;
            case ">=":
              lines.push("  cmp rax, rbx");
              lines.push("  setge al");
              lines.push("  movzx rax, al");
              break;
          }

          lines.push(`  mov QWORD PTR [rbp-${this.getOffset(inst.dest)}], rax`);
          break;

        case "UNARY":
          this.loadOperandToReg("rax", inst.src, lines);
          if (inst.op === "-") {
            lines.push("  neg rax");
          } else if (inst.op === "!") {
            lines.push("  cmp rax, 0");
            lines.push("  sete al");
            lines.push("  movzx rax, al");
          }
          lines.push(`  mov QWORD PTR [rbp-${this.getOffset(inst.dest)}], rax`);
          break;

        case "JUMP":
          lines.push(`  jmp ${inst.target}`);
          break;

        case "JUMP_IF":
          this.loadOperandToReg("rax", inst.condition, lines);
          lines.push("  cmp rax, 0");
          lines.push(`  jne ${inst.target}`);
          break;

        case "JUMP_IF_FALSE":
          this.loadOperandToReg("rax", inst.condition, lines);
          lines.push("  cmp rax, 0");
          lines.push(`  je ${inst.target}`);
          break;

        case "PARAM":
          this.loadOperandToReg("rdi", inst.arg, lines);
          lines.push("  push rdi");
          break;

        case "CALL":
          lines.push(`  call ${inst.func}`);
          if (inst.argCount > 0) {
            lines.push(`  add rsp, ${inst.argCount * 8}  ; clean stack`);
          }
          if (inst.dest) {
            lines.push(`  mov QWORD PTR [rbp-${this.getOffset(inst.dest)}], rax`);
          }
          break;

        case "RETURN":
          if (inst.value) {
            this.loadOperandToReg("rax", inst.value, lines);
          }
          lines.push("  mov rsp, rbp");
          lines.push("  pop rbp");
          lines.push("  ret");
          break;

        case "PRINT":
          for (const arg of inst.args) {
            this.loadOperandToReg("rdi", arg, lines);
            lines.push("  ; call mini_print(rdi)");
          }
          break;
      }
    }

    return lines.join("\n");
  }

  private loadOperandToReg(reg: string, op: any, lines: string[]): void {
    if (op.kind === "constant") {
      lines.push(`  mov ${reg}, ${op.value}`);
    } else {
      lines.push(`  mov ${reg}, QWORD PTR [rbp-${this.getOffset(op)}]`);
    }
  }

  private getOffset(op: any): number {
    const name = String(op.value);
    // Simple deterministic hash to stack offset
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = (hash << 5) - hash + name.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash % 56) + 8;
  }
}
