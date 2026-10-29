import {
  Program,
  Declaration,
  Statement,
  FunctionDeclaration,
  VariableDeclaration,
  BlockStatement,
  AssignmentStatement,
  IfStatement,
  WhileStatement,
  ForStatement,
  ReturnStatement,
  PrintStatement,
  ExpressionStatement,
  Expression,
  BinaryExpression,
  UnaryExpression,
  CallExpression,
  LiteralExpression,
  IdentifierExpression,
  GroupingExpression,
  ASTNodeKind,
} from "../ast/nodes";
import { Opcode, BytecodeInstruction } from "./bytecode";

export class BytecodeGenerator {
  private instructions: BytecodeInstruction[] = [];
  private functionAddresses = new Map<string, number>();

  public generate(program: Program): BytecodeInstruction[] {
    this.instructions = [];
    this.functionAddresses.clear();

    const functions: FunctionDeclaration[] = [];
    const globalStatements: Declaration[] = [];

    for (const decl of program.declarations) {
      if (decl.kind === ASTNodeKind.FunctionDeclaration) {
        functions.push(decl);
      } else {
        globalStatements.push(decl);
      }
    }

    // If there are functions, jump past them to the main entry point
    let jumpToMainIndex = -1;
    if (functions.length > 0 && globalStatements.length > 0) {
      jumpToMainIndex = this.emit(Opcode.JMP, 0, undefined, "jump to main");
    }

    // Compile functions
    for (const fn of functions) {
      this.compileFunction(fn);
    }

    // Patch jump to main
    if (jumpToMainIndex !== -1) {
      this.instructions[jumpToMainIndex].operand = this.instructions.length;
    }

    // Compile global statements
    for (const stmt of globalStatements) {
      this.compileDeclaration(stmt);
    }

    // Emit HALT at end of execution
    this.emit(Opcode.HALT);

    // Second pass: resolve function call targets
    for (const inst of this.instructions) {
      if (inst.opcode === Opcode.CALL && typeof inst.operand === "string") {
        const addr = this.functionAddresses.get(inst.operand);
        if (addr !== undefined) {
          inst.operand = addr; // Convert function name to instruction address
        }
      }
    }

    return [...this.instructions];
  }

  private compileFunction(fn: FunctionDeclaration): void {
    const entryAddr = this.instructions.length;
    this.functionAddresses.set(fn.name, entryAddr);

    // Parameters are passed on stack in left-to-right order.
    // In stack frame, pop in reverse order into local variables:
    for (let i = fn.parameters.length - 1; i >= 0; i--) {
      this.emit(
        Opcode.STORE,
        fn.parameters[i].name,
        undefined,
        `param ${fn.parameters[i].name}`
      );
    }

    for (const s of fn.body.statements) {
      this.compileStatement(s);
    }

    // Default void return if none exists
    const lastInst = this.instructions[this.instructions.length - 1];
    if (!lastInst || lastInst.opcode !== Opcode.RET) {
      this.emit(Opcode.RET);
    }
  }

  private compileDeclaration(decl: Declaration): void {
    if (decl.kind === ASTNodeKind.VariableDeclaration) {
      this.compileVariableDeclaration(decl);
    } else if (decl.kind !== ASTNodeKind.FunctionDeclaration) {
      // FunctionDeclarations are compiled separately in generate(); here we
      // only reach non-function, non-variable top-level statements.
      this.compileStatement(decl as Statement);
    }
  }

  private compileVariableDeclaration(decl: VariableDeclaration): void {
    if (decl.initializer) {
      this.compileExpression(decl.initializer);
      this.emit(Opcode.STORE, decl.name);
    }
  }

  private compileStatement(stmt: Statement): void {
    switch (stmt.kind) {
      case ASTNodeKind.VariableDeclaration:
        this.compileVariableDeclaration(stmt);
        break;

      case ASTNodeKind.AssignmentStatement:
        this.compileExpression(stmt.value);
        this.emit(Opcode.STORE, stmt.target);
        break;

      case ASTNodeKind.BlockStatement:
        for (const s of stmt.statements) {
          this.compileStatement(s);
        }
        break;

      case ASTNodeKind.IfStatement:
        this.compileIfStatement(stmt);
        break;

      case ASTNodeKind.WhileStatement:
        this.compileWhileStatement(stmt);
        break;

      case ASTNodeKind.ForStatement:
        this.compileForStatement(stmt);
        break;

      case ASTNodeKind.ReturnStatement:
        if (stmt.argument) {
          this.compileExpression(stmt.argument);
        }
        this.emit(Opcode.RET);
        break;

      case ASTNodeKind.PrintStatement:
        for (const arg of stmt.arguments) {
          this.compileExpression(arg);
        }
        this.emit(Opcode.PRINT, stmt.arguments.length);
        break;

      case ASTNodeKind.ExpressionStatement:
        this.compileExpression(stmt.expression);
        // Pop result if an expression value was pushed but unused
        this.emit(Opcode.POP);
        break;
    }
  }

  private compileIfStatement(stmt: IfStatement): void {
    this.compileExpression(stmt.condition);
    const jumpFalseIdx = this.emit(Opcode.JMP_IF_FALSE, 0);

    for (const s of stmt.consequent.statements) {
      this.compileStatement(s);
    }

    if (stmt.alternate) {
      const jumpEndIdx = this.emit(Opcode.JMP, 0);
      this.instructions[jumpFalseIdx].operand = this.instructions.length;

      for (const s of stmt.alternate.statements) {
        this.compileStatement(s);
      }
      this.instructions[jumpEndIdx].operand = this.instructions.length;
    } else {
      this.instructions[jumpFalseIdx].operand = this.instructions.length;
    }
  }

  private compileWhileStatement(stmt: WhileStatement): void {
    const loopStart = this.instructions.length;
    this.compileExpression(stmt.condition);
    const jumpFalseIdx = this.emit(Opcode.JMP_IF_FALSE, 0);

    for (const s of stmt.body.statements) {
      this.compileStatement(s);
    }

    this.emit(Opcode.JMP, loopStart);
    this.instructions[jumpFalseIdx].operand = this.instructions.length;
  }

  private compileForStatement(stmt: ForStatement): void {
    if (stmt.initializer) {
      if (stmt.initializer.kind === ASTNodeKind.VariableDeclaration) {
        this.compileVariableDeclaration(stmt.initializer);
      } else {
        this.compileExpression(stmt.initializer.value);
        this.emit(Opcode.STORE, stmt.initializer.target);
      }
    }

    const loopStart = this.instructions.length;
    let jumpFalseIdx = -1;

    if (stmt.condition) {
      this.compileExpression(stmt.condition);
      jumpFalseIdx = this.emit(Opcode.JMP_IF_FALSE, 0);
    }

    for (const s of stmt.body.statements) {
      this.compileStatement(s);
    }

    if (stmt.update) {
      if (stmt.update.kind === ASTNodeKind.AssignmentStatement) {
        // Update is an assignment: compile value and store — no leftover stack value
        this.compileExpression(stmt.update.value);
        this.emit(Opcode.STORE, stmt.update.target);
      } else {
        // Update is a plain expression: compile and discard result
        this.compileExpression(stmt.update);
        this.emit(Opcode.POP);
      }
    }

    this.emit(Opcode.JMP, loopStart);

    if (jumpFalseIdx !== -1) {
      this.instructions[jumpFalseIdx].operand = this.instructions.length;
    }
  }

  public compileExpression(expr: Expression): void {
    switch (expr.kind) {
      case ASTNodeKind.LiteralExpression:
        if (expr.literalType === "int") {
          this.emit(Opcode.PUSH_INT, expr.value);
        } else if (expr.literalType === "float") {
          this.emit(Opcode.PUSH_FLOAT, expr.value);
        } else if (expr.literalType === "bool") {
          this.emit(Opcode.PUSH_BOOL, expr.value);
        } else {
          this.emit(Opcode.PUSH_STR, expr.value);
        }
        break;

      case ASTNodeKind.IdentifierExpression:
        this.emit(Opcode.LOAD, expr.name);
        break;

      case ASTNodeKind.GroupingExpression:
        this.compileExpression(expr.expression);
        break;

      case ASTNodeKind.UnaryExpression:
        this.compileExpression(expr.operand);
        if (expr.operator === "-") {
          this.emit(Opcode.NEG);
        } else if (expr.operator === "!") {
          this.emit(Opcode.NOT);
        }
        break;

      case ASTNodeKind.BinaryExpression:
        this.compileBinaryExpression(expr);
        break;

      case ASTNodeKind.CallExpression:
        for (const arg of expr.arguments) {
          this.compileExpression(arg);
        }
        this.emit(Opcode.CALL, expr.callee, expr.arguments.length);
        break;
    }
  }

  private compileBinaryExpression(expr: BinaryExpression): void {
    // Short-circuiting for logical operators
    if (expr.operator === "&&") {
      this.compileExpression(expr.left);
      this.emit(Opcode.DUP);
      const jumpFalseIdx = this.emit(Opcode.JMP_IF_FALSE, 0);
      this.emit(Opcode.POP);
      this.compileExpression(expr.right);
      this.instructions[jumpFalseIdx].operand = this.instructions.length;
      return;
    }

    if (expr.operator === "||") {
      this.compileExpression(expr.left);
      this.emit(Opcode.DUP);
      const jumpTrueIdx = this.emit(Opcode.JMP_IF_TRUE, 0);
      this.emit(Opcode.POP);
      this.compileExpression(expr.right);
      this.instructions[jumpTrueIdx].operand = this.instructions.length;
      return;
    }

    this.compileExpression(expr.left);
    this.compileExpression(expr.right);

    switch (expr.operator) {
      case "+":
        this.emit(Opcode.ADD);
        break;
      case "-":
        this.emit(Opcode.SUB);
        break;
      case "*":
        this.emit(Opcode.MUL);
        break;
      case "/":
        this.emit(Opcode.DIV);
        break;
      case "%":
        this.emit(Opcode.MOD);
        break;
      case "==":
        this.emit(Opcode.EQ);
        break;
      case "!=":
        this.emit(Opcode.NEQ);
        break;
      case "<":
        this.emit(Opcode.LT);
        break;
      case "<=":
        this.emit(Opcode.LTE);
        break;
      case ">":
        this.emit(Opcode.GT);
        break;
      case ">=":
        this.emit(Opcode.GTE);
        break;
    }
  }

  private emit(
    opcode: Opcode,
    operand?: any,
    operand2?: any,
    comment?: string
  ): number {
    const address = this.instructions.length;
    this.instructions.push({
      address,
      opcode,
      operand,
      operand2,
      comment,
    });
    return address;
  }
}
