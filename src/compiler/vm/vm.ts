import { Opcode, BytecodeInstruction } from "../codegen/bytecode";

export interface CallFrame {
  returnAddress: number;
  locals: Map<string, any>;
  functionName: string;
}

export type VMStatus = "ready" | "running" | "paused" | "halted" | "error";

export interface VMState {
  ip: number;
  stack: any[];
  callStack: { functionName: string; returnAddress: number; locals: Record<string, any> }[];
  globals: Record<string, any>;
  output: string[];
  status: VMStatus;
  errorMessage?: string;
  totalSteps: number;
}

export class VirtualMachine {
  private instructions: BytecodeInstruction[];
  private ip = 0;
  private stack: any[] = [];
  private callStack: CallFrame[] = [];
  private globals = new Map<string, any>();
  private output: string[] = [];
  private status: VMStatus = "ready";
  private errorMessage?: string;
  private breakpoints = new Set<number>();
  private totalSteps = 0;

  constructor(instructions: BytecodeInstruction[] = []) {
    this.instructions = instructions;
  }

  public load(instructions: BytecodeInstruction[]): void {
    this.instructions = instructions;
    this.reset();
  }

  public reset(): void {
    this.ip = 0;
    this.stack = [];
    this.callStack = [];
    this.globals.clear();
    this.output = [];
    this.status = "ready";
    this.errorMessage = undefined;
    this.totalSteps = 0;
  }

  public addBreakpoint(address: number): void {
    this.breakpoints.add(address);
  }

  public removeBreakpoint(address: number): void {
    this.breakpoints.delete(address);
  }

  public clearBreakpoints(): void {
    this.breakpoints.clear();
  }

  public getState(): VMState {
    const callStackView = this.callStack.map((f) => ({
      functionName: f.functionName,
      returnAddress: f.returnAddress,
      locals: Object.fromEntries(f.locals.entries()),
    }));

    return {
      ip: this.ip,
      stack: [...this.stack],
      callStack: callStackView,
      globals: Object.fromEntries(this.globals.entries()),
      output: [...this.output],
      status: this.status,
      errorMessage: this.errorMessage,
      totalSteps: this.totalSteps,
    };
  }

  public step(): VMState {
    if (this.status === "halted" || this.status === "error") {
      return this.getState();
    }

    if (this.ip >= this.instructions.length) {
      this.status = "halted";
      return this.getState();
    }

    const inst = this.instructions[this.ip];
    this.totalSteps++;
    this.status = "running";

    try {
      this.executeInstruction(inst);
    } catch (err: any) {
      this.status = "error";
      this.errorMessage = err.message || "Runtime execution error";
      return this.getState();
    }

    if (this.status === "running") {
      if (this.ip >= this.instructions.length) {
        this.status = "halted";
      } else if (this.breakpoints.has(this.ip)) {
        this.status = "paused";
      }
    }

    return this.getState();
  }

  public run(maxSteps = 50000): VMState {
    this.status = "running";
    let steps = 0;

    while (this.status === "running" && steps < maxSteps) {
      this.step();
      steps++;
      if ((this.status as string) === "paused") break;
    }

    if (steps >= maxSteps && (this.status as string) === "running") {
      this.status = "error";
      this.errorMessage = `Execution exceeded step limit of ${maxSteps} instructions (possible infinite loop)`;
    }

    return this.getState();
  }

  private executeInstruction(inst: BytecodeInstruction): void {
    this.ip++; // Advance IP to next instruction by default

    switch (inst.opcode) {
      case Opcode.PUSH_INT:
      case Opcode.PUSH_FLOAT:
      case Opcode.PUSH_BOOL:
      case Opcode.PUSH_STR:
        this.stack.push(inst.operand);
        break;

      case Opcode.LOAD: {
        const varName = inst.operand as string;
        let val: any = undefined;

        // Check local frame first
        if (this.callStack.length > 0) {
          const currentFrame = this.callStack[this.callStack.length - 1];
          if (currentFrame.locals.has(varName)) {
            val = currentFrame.locals.get(varName);
          }
        }

        // Check globals if not found in locals
        if (val === undefined && this.globals.has(varName)) {
          val = this.globals.get(varName);
        }

        if (val === undefined) {
          throw new Error(`Variable '${varName}' is not defined in scope`);
        }

        this.stack.push(val);
        break;
      }

      case Opcode.STORE: {
        const varName = inst.operand as string;
        if (this.stack.length === 0) {
          throw new Error(`Stack underflow on STORE '${varName}'`);
        }
        const val = this.stack.pop();

        if (this.callStack.length > 0) {
          // If in a function, store into local frame
          const currentFrame = this.callStack[this.callStack.length - 1];
          currentFrame.locals.set(varName, val);
        } else {
          // Global scope
          this.globals.set(varName, val);
        }
        break;
      }

      case Opcode.ADD: {
        const b = this.popStack();
        const a = this.popStack();
        if (typeof a === "string" || typeof b === "string") {
          this.stack.push(`${a}${b}`);
        } else {
          this.stack.push(a + b);
        }
        break;
      }

      case Opcode.SUB: {
        const b = this.popStack();
        const a = this.popStack();
        this.stack.push(a - b);
        break;
      }

      case Opcode.MUL: {
        const b = this.popStack();
        const a = this.popStack();
        this.stack.push(a * b);
        break;
      }

      case Opcode.DIV: {
        const b = this.popStack();
        const a = this.popStack();
        if (b === 0) throw new Error("Runtime Error: Division by zero");
        this.stack.push(typeof a === "number" && typeof b === "number" && Number.isInteger(a) && Number.isInteger(b) ? Math.trunc(a / b) : a / b);
        break;
      }

      case Opcode.MOD: {
        const b = this.popStack();
        const a = this.popStack();
        if (b === 0) throw new Error("Runtime Error: Division by zero in modulo");
        this.stack.push(a % b);
        break;
      }

      case Opcode.EQ: {
        const b = this.popStack();
        const a = this.popStack();
        this.stack.push(a === b);
        break;
      }

      case Opcode.NEQ: {
        const b = this.popStack();
        const a = this.popStack();
        this.stack.push(a !== b);
        break;
      }

      case Opcode.LT: {
        const b = this.popStack();
        const a = this.popStack();
        this.stack.push(a < b);
        break;
      }

      case Opcode.LTE: {
        const b = this.popStack();
        const a = this.popStack();
        this.stack.push(a <= b);
        break;
      }

      case Opcode.GT: {
        const b = this.popStack();
        const a = this.popStack();
        this.stack.push(a > b);
        break;
      }

      case Opcode.GTE: {
        const b = this.popStack();
        const a = this.popStack();
        this.stack.push(a >= b);
        break;
      }

      case Opcode.NOT: {
        const val = this.popStack();
        this.stack.push(!Boolean(val));
        break;
      }

      case Opcode.NEG: {
        const val = this.popStack();
        this.stack.push(-val);
        break;
      }

      case Opcode.JMP: {
        this.ip = inst.operand as number;
        break;
      }

      case Opcode.JMP_IF_TRUE: {
        const val = this.popStack();
        if (Boolean(val)) {
          this.ip = inst.operand as number;
        }
        break;
      }

      case Opcode.JMP_IF_FALSE: {
        const val = this.popStack();
        if (!Boolean(val)) {
          this.ip = inst.operand as number;
        }
        break;
      }

      case Opcode.CALL: {
        const targetAddr = inst.operand as number;
        const argCount = inst.operand2 as number;

        if (this.callStack.length >= 1000) {
          throw new Error("Stack overflow: Maximum call stack size exceeded");
        }

        // Push new call frame with return address
        this.callStack.push({
          returnAddress: this.ip,
          locals: new Map(),
          functionName: `func@${targetAddr}`,
        });

        this.ip = targetAddr;
        break;
      }

      case Opcode.RET: {
        if (this.callStack.length === 0) {
          this.status = "halted";
          return;
        }
        const frame = this.callStack.pop()!;
        this.ip = frame.returnAddress;
        break;
      }

      case Opcode.PRINT: {
        const count = inst.operand as number;
        const printArgs: any[] = [];
        for (let i = 0; i < count; i++) {
          printArgs.unshift(this.popStack());
        }
        const line = printArgs.map(String).join(" ");
        this.output.push(line);
        break;
      }

      case Opcode.POP: {
        if (this.stack.length > 0) {
          this.stack.pop();
        }
        break;
      }

      case Opcode.DUP: {
        if (this.stack.length === 0) {
          throw new Error("Stack underflow on DUP");
        }
        this.stack.push(this.stack[this.stack.length - 1]);
        break;
      }

      case Opcode.HALT: {
        this.status = "halted";
        break;
      }
    }
  }

  private popStack(): any {
    if (this.stack.length === 0) {
      throw new Error("Stack underflow: Attempted to pop from empty operand stack");
    }
    return this.stack.pop();
  }
}
