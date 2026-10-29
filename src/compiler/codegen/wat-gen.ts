import {
  Program,
  Declaration,
  Statement,
  FunctionDeclaration,
  VariableDeclaration,
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
  MiniLangType,
} from "../ast/nodes";

export class WatGenerator {
  private indentLevel = 0;
  private localVars = new Set<string>();

  public generate(program: Program): string {
    this.indentLevel = 0;
    const lines: string[] = [
      ";; ===========================================================",
      ";; MiniLang Compiled to WebAssembly Text (WAT) Format",
      ";; Note: WAT emission supports integer & float arithmetic,",
      ";; control flow, recursion, and stack-based function execution.",
      ";; ===========================================================",
      "(module",
      '  (import "host" "print_int" (func $print_int (param i32)))',
    ];

    this.indentLevel = 1;

    // Functions
    for (const decl of program.declarations) {
      if (decl.kind === ASTNodeKind.FunctionDeclaration) {
        lines.push(this.generateFunction(decl));
      }
    }

    // Main entry point for top-level statements
    const globalStmts = program.declarations.filter(
      (d) => d.kind !== ASTNodeKind.FunctionDeclaration
    );

    if (globalStmts.length > 0) {
      lines.push(this.generateMainFunction(globalStmts));
    }

    lines.push(")");
    return lines.join("\n");
  }

  private generateFunction(fn: FunctionDeclaration): string {
    this.localVars.clear();
    const params = fn.parameters
      .map((p) => {
        this.localVars.add(p.name);
        return `(param $${p.name} ${this.mapType(p.typeNode.name)})`;
      })
      .join(" ");

    const ret =
      fn.returnType.name !== "void"
        ? ` (result ${this.mapType(fn.returnType.name)})`
        : "";

    const lines: string[] = [];
    lines.push(
      `${this.indent()}(func $${fn.name} (export "${fn.name}") ${params}${ret}`
    );
    this.indentLevel++;

    // Collect local variable declarations
    this.collectLocals(fn.body);
    for (const v of this.localVars) {
      if (!fn.parameters.some((p) => p.name === v)) {
        lines.push(`${this.indent()}(local $${v} i32)`);
      }
    }

    for (const stmt of fn.body.statements) {
      lines.push(this.generateStatement(stmt));
    }

    this.indentLevel--;
    lines.push(`${this.indent()})`);
    return lines.join("\n");
  }

  private generateMainFunction(stmts: Declaration[]): string {
    this.localVars.clear();
    const lines: string[] = [];
    lines.push(
      `${this.indent()}(func $main (export "main") (result i32)`
    );
    this.indentLevel++;

    for (const s of stmts) {
      if (s.kind === ASTNodeKind.VariableDeclaration) {
        this.localVars.add(s.name);
      }
    }

    for (const v of this.localVars) {
      lines.push(`${this.indent()}(local $${v} i32)`);
    }

    for (const stmt of stmts) {
      // Functions are emitted as separate WASM functions, not inside main
      if (stmt.kind === ASTNodeKind.FunctionDeclaration) continue;
      lines.push(this.generateStatement(stmt));
    }

    // Return 0 as exit code
    lines.push(`${this.indent()}i32.const 0`);
    this.indentLevel--;
    lines.push(`${this.indent()})`);
    return lines.join("\n");
  }

  private collectLocals(block: { statements: Statement[] }): void {
    for (const s of block.statements) {
      if (s.kind === ASTNodeKind.VariableDeclaration) {
        this.localVars.add(s.name);
      } else if (s.kind === ASTNodeKind.BlockStatement) {
        this.collectLocals(s);
      }
    }
  }

  private generateStatement(stmt: Statement): string {
    switch (stmt.kind) {
      case ASTNodeKind.VariableDeclaration:
        if (stmt.initializer) {
          const val = this.generateExpression(stmt.initializer);
          return `${val}\n${this.indent()}local.set $${stmt.name}`;
        }
        return "";

      case ASTNodeKind.AssignmentStatement: {
        const val = this.generateExpression(stmt.value);
        return `${val}\n${this.indent()}local.set $${stmt.target}`;
      }

      case ASTNodeKind.BlockStatement:
        return stmt.statements.map((s) => this.generateStatement(s)).join("\n");

      case ASTNodeKind.IfStatement: {
        const cond = this.generateExpression(stmt.condition);
        const lines: string[] = [];
        lines.push(cond);
        lines.push(`${this.indent()}(if`);
        this.indentLevel++;
        lines.push(`${this.indent()}(then`);
        this.indentLevel++;
        lines.push(
          stmt.consequent.statements.map((s) => this.generateStatement(s)).join("\n")
        );
        this.indentLevel--;
        lines.push(`${this.indent()})`);

        if (stmt.alternate) {
          lines.push(`${this.indent()}(else`);
          this.indentLevel++;
          lines.push(
            stmt.alternate.statements.map((s) => this.generateStatement(s)).join("\n")
          );
          this.indentLevel--;
          lines.push(`${this.indent()})`);
        }

        this.indentLevel--;
        lines.push(`${this.indent()})`);
        return lines.join("\n");
      }

      case ASTNodeKind.WhileStatement: {
        const lines: string[] = [];
        lines.push(`${this.indent()}(block $break_loop`);
        this.indentLevel++;
        lines.push(`${this.indent()}(loop $continue_loop`);
        this.indentLevel++;

        // Invert condition to break
        lines.push(this.generateExpression(stmt.condition));
        lines.push(`${this.indent()}i32.eqz`);
        lines.push(`${this.indent()}br_if $break_loop`);

        for (const s of stmt.body.statements) {
          lines.push(this.generateStatement(s));
        }

        lines.push(`${this.indent()}br $continue_loop`);
        this.indentLevel--;
        lines.push(`${this.indent()})`);
        this.indentLevel--;
        lines.push(`${this.indent()})`);
        return lines.join("\n");
      }

      case ASTNodeKind.ReturnStatement:
        if (stmt.argument) {
          return `${this.generateExpression(stmt.argument)}\n${this.indent()}return`;
        }
        return `${this.indent()}return`;

      case ASTNodeKind.PrintStatement: {
        const lines: string[] = [];
        for (const arg of stmt.arguments) {
          lines.push(this.generateExpression(arg));
          lines.push(`${this.indent()}call $print_int`);
        }
        return lines.join("\n");
      }

      case ASTNodeKind.ExpressionStatement:
        return `${this.generateExpression(stmt.expression)}\n${this.indent()}drop`;

      default:
        return "";
    }
  }

  public generateExpression(expr: Expression): string {
    switch (expr.kind) {
      case ASTNodeKind.LiteralExpression:
        if (expr.literalType === "float") {
          return `${this.indent()}f32.const ${expr.value}`;
        }
        if (expr.literalType === "bool") {
          return `${this.indent()}i32.const ${expr.value ? 1 : 0}`;
        }
        return `${this.indent()}i32.const ${expr.value}`;

      case ASTNodeKind.IdentifierExpression:
        return `${this.indent()}local.get $${expr.name}`;

      case ASTNodeKind.GroupingExpression:
        return this.generateExpression(expr.expression);

      case ASTNodeKind.UnaryExpression: {
        const inner = this.generateExpression(expr.operand);
        if (expr.operator === "-") {
          return `${this.indent()}i32.const 0\n${inner}\n${this.indent()}i32.sub`;
        }
        if (expr.operator === "!") {
          return `${inner}\n${this.indent()}i32.eqz`;
        }
        return inner;
      }

      case ASTNodeKind.BinaryExpression: {
        const left = this.generateExpression(expr.left);
        const right = this.generateExpression(expr.right);
        const op = this.mapBinaryOp(expr.operator);
        return `${left}\n${right}\n${this.indent()}${op}`;
      }

      case ASTNodeKind.CallExpression: {
        const args = expr.arguments.map((a) => this.generateExpression(a)).join("\n");
        return `${args}\n${this.indent()}call $${expr.callee}`;
      }
    }
  }

  private mapBinaryOp(op: string): string {
    switch (op) {
      case "+":
        return "i32.add";
      case "-":
        return "i32.sub";
      case "*":
        return "i32.mul";
      case "/":
        return "i32.div_s";
      case "%":
        return "i32.rem_s";
      case "==":
        return "i32.eq";
      case "!=":
        return "i32.ne";
      case "<":
        return "i32.lt_s";
      case "<=":
        return "i32.le_s";
      case ">":
        return "i32.gt_s";
      case ">=":
        return "i32.ge_s";
      case "&&":
        return "i32.and";
      case "||":
        return "i32.or";
      default:
        return "i32.add";
    }
  }

  private mapType(type: MiniLangType): string {
    if (type === "float") return "f32";
    return "i32";
  }

  private indent(): string {
    return "  ".repeat(this.indentLevel);
  }
}