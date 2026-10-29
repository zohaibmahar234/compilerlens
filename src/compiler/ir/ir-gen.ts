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
import {
  TACInstruction,
  TACProgram,
  Operand,
  temporary,
  variable,
  constant,
} from "./tac";

export class TACGenerator {
  private tempCounter = 0;
  private labelCounter = 0;
  private instructions: TACInstruction[] = [];

  public generate(program: Program): TACProgram {
    this.tempCounter = 0;
    this.labelCounter = 0;
    this.instructions = [];

    // Separate global statements from function declarations
    const functions: FunctionDeclaration[] = [];
    const globalStatements: Declaration[] = [];

    for (const decl of program.declarations) {
      if (decl.kind === ASTNodeKind.FunctionDeclaration) {
        functions.push(decl);
      } else {
        globalStatements.push(decl);
      }
    }

    // Emit functions first
    for (const fn of functions) {
      this.generateFunction(fn);
    }

    // Emit main entry if there are global statements
    if (globalStatements.length > 0) {
      if (functions.length > 0) {
        this.emit({ kind: "LABEL", name: "main" });
      }
      for (const stmt of globalStatements) {
        this.generateDeclaration(stmt);
      }
    }

    return {
      instructions: [...this.instructions],
    };
  }

  private generateFunction(fn: FunctionDeclaration): void {
    this.emit({ kind: "LABEL", name: fn.name });

    // In TAC, parameters are already available in function local frame
    for (const stmt of fn.body.statements) {
      this.generateStatement(stmt);
    }

    // Default return for void or safe fallthrough
    if (fn.returnType.name === "void") {
      this.emit({ kind: "RETURN" });
    }
  }

  private generateDeclaration(decl: Declaration): void {
    if (decl.kind === ASTNodeKind.VariableDeclaration) {
      this.generateVariableDeclaration(decl);
    } else if (decl.kind !== ASTNodeKind.FunctionDeclaration) {
      // Functions are emitted separately via generateFunction
      this.generateStatement(decl);
    }
  }

  private generateVariableDeclaration(decl: VariableDeclaration): void {
    if (decl.initializer) {
      const src = this.generateExpression(decl.initializer);
      this.emit({
        kind: "ASSIGN",
        dest: variable(decl.name, decl.typeNode.name),
        src,
      });
    }
  }

  private generateStatement(stmt: Statement): void {
    switch (stmt.kind) {
      case ASTNodeKind.VariableDeclaration:
        this.generateVariableDeclaration(stmt);
        break;

      case ASTNodeKind.AssignmentStatement: {
        const src = this.generateExpression(stmt.value);
        this.emit({
          kind: "ASSIGN",
          dest: variable(stmt.target),
          src,
        });
        break;
      }

      case ASTNodeKind.BlockStatement:
        for (const s of stmt.statements) {
          this.generateStatement(s);
        }
        break;

      case ASTNodeKind.IfStatement:
        this.generateIfStatement(stmt);
        break;

      case ASTNodeKind.WhileStatement:
        this.generateWhileStatement(stmt);
        break;

      case ASTNodeKind.ForStatement:
        this.generateForStatement(stmt);
        break;

      case ASTNodeKind.ReturnStatement:
        if (stmt.argument) {
          const val = this.generateExpression(stmt.argument);
          this.emit({ kind: "RETURN", value: val });
        } else {
          this.emit({ kind: "RETURN" });
        }
        break;

      case ASTNodeKind.PrintStatement: {
        const args = stmt.arguments.map((arg) => this.generateExpression(arg));
        this.emit({ kind: "PRINT", args });
        break;
      }

      case ASTNodeKind.ExpressionStatement:
        this.generateExpression(stmt.expression);
        break;
    }
  }

  private generateIfStatement(stmt: IfStatement): void {
    const cond = this.generateExpression(stmt.condition);
    const elseLabel = this.newLabel();
    const endLabel = this.newLabel();

    this.emit({
      kind: "JUMP_IF_FALSE",
      condition: cond,
      target: stmt.alternate ? elseLabel : endLabel,
    });

    for (const s of stmt.consequent.statements) {
      this.generateStatement(s);
    }

    if (stmt.alternate) {
      this.emit({ kind: "JUMP", target: endLabel });
      this.emit({ kind: "LABEL", name: elseLabel });
      for (const s of stmt.alternate.statements) {
        this.generateStatement(s);
      }
    }

    this.emit({ kind: "LABEL", name: endLabel });
  }

  private generateWhileStatement(stmt: WhileStatement): void {
    const startLabel = this.newLabel();
    const endLabel = this.newLabel();

    this.emit({ kind: "LABEL", name: startLabel });
    const cond = this.generateExpression(stmt.condition);
    this.emit({ kind: "JUMP_IF_FALSE", condition: cond, target: endLabel });

    for (const s of stmt.body.statements) {
      this.generateStatement(s);
    }

    this.emit({ kind: "JUMP", target: startLabel });
    this.emit({ kind: "LABEL", name: endLabel });
  }

  private generateForStatement(stmt: ForStatement): void {
    if (stmt.initializer) {
      if (stmt.initializer.kind === ASTNodeKind.VariableDeclaration) {
        this.generateVariableDeclaration(stmt.initializer);
      } else {
        const val = this.generateExpression(stmt.initializer.value);
        this.emit({
          kind: "ASSIGN",
          dest: variable(stmt.initializer.target),
          src: val,
        });
      }
    }

    const startLabel = this.newLabel();
    const endLabel = this.newLabel();

    this.emit({ kind: "LABEL", name: startLabel });

    if (stmt.condition) {
      const cond = this.generateExpression(stmt.condition);
      this.emit({ kind: "JUMP_IF_FALSE", condition: cond, target: endLabel });
    }

    for (const s of stmt.body.statements) {
      this.generateStatement(s);
    }

    if (stmt.update) {
      if (stmt.update.kind === ASTNodeKind.AssignmentStatement) {
        const val = this.generateExpression(stmt.update.value);
        this.emit({
          kind: "ASSIGN",
          dest: variable(stmt.update.target),
          src: val,
        });
      } else {
        this.generateExpression(stmt.update);
      }
    }

    this.emit({ kind: "JUMP", target: startLabel });
    this.emit({ kind: "LABEL", name: endLabel });
  }

  // -------------------------------------------------------------
  // Expression TAC Generation
  // -------------------------------------------------------------

  public generateExpression(expr: Expression): Operand {
    switch (expr.kind) {
      case ASTNodeKind.LiteralExpression:
        return constant(expr.value, expr.literalType);

      case ASTNodeKind.IdentifierExpression:
        return variable(expr.name, expr.inferredType);

      case ASTNodeKind.GroupingExpression:
        return this.generateExpression(expr.expression);

      case ASTNodeKind.UnaryExpression: {
        const src = this.generateExpression(expr.operand);
        const dest = this.newTemp(expr.inferredType);
        this.emit({
          kind: "UNARY",
          dest,
          op: expr.operator,
          src,
        });
        return dest;
      }

      case ASTNodeKind.BinaryExpression:
        return this.generateBinaryExpression(expr);

      case ASTNodeKind.CallExpression: {
        const argOperands: Operand[] = [];
        for (const arg of expr.arguments) {
          const argOp = this.generateExpression(arg);
          argOperands.push(argOp);
        }
        for (const argOp of argOperands) {
          this.emit({ kind: "PARAM", arg: argOp });
        }
        const dest =
          expr.inferredType && expr.inferredType !== "void"
            ? this.newTemp(expr.inferredType)
            : undefined;

        this.emit({
          kind: "CALL",
          dest,
          func: expr.callee,
          argCount: expr.arguments.length,
        });

        return dest ?? constant(0, "int");
      }
    }
  }

  private generateBinaryExpression(expr: BinaryExpression): Operand {
    // Short-circuiting for logical AND (&&)
    if (expr.operator === "&&") {
      const dest = this.newTemp("bool");
      const left = this.generateExpression(expr.left);
      const falseLabel = this.newLabel();
      const endLabel = this.newLabel();

      this.emit({ kind: "JUMP_IF_FALSE", condition: left, target: falseLabel });
      const right = this.generateExpression(expr.right);
      this.emit({ kind: "ASSIGN", dest, src: right });
      this.emit({ kind: "JUMP", target: endLabel });

      this.emit({ kind: "LABEL", name: falseLabel });
      this.emit({ kind: "ASSIGN", dest, src: constant(false, "bool") });

      this.emit({ kind: "LABEL", name: endLabel });
      return dest;
    }

    // Short-circuiting for logical OR (||)
    if (expr.operator === "||") {
      const dest = this.newTemp("bool");
      const left = this.generateExpression(expr.left);
      const trueLabel = this.newLabel();
      const endLabel = this.newLabel();

      this.emit({ kind: "JUMP_IF", condition: left, target: trueLabel });
      const right = this.generateExpression(expr.right);
      this.emit({ kind: "ASSIGN", dest, src: right });
      this.emit({ kind: "JUMP", target: endLabel });

      this.emit({ kind: "LABEL", name: trueLabel });
      this.emit({ kind: "ASSIGN", dest, src: constant(true, "bool") });

      this.emit({ kind: "LABEL", name: endLabel });
      return dest;
    }

    const left = this.generateExpression(expr.left);
    const right = this.generateExpression(expr.right);
    const dest = this.newTemp(expr.inferredType);

    this.emit({
      kind: "BINARY",
      dest,
      op: expr.operator,
      left,
      right,
    });

    return dest;
  }

  private emit(instruction: TACInstruction): void {
    this.instructions.push(instruction);
  }

  private newTemp(type?: any): Operand {
    return temporary(this.tempCounter++, type);
  }

  private newLabel(): string {
    return `L${this.labelCounter++}`;
  }
}
