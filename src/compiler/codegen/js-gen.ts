import {
  Program,
  Declaration,
  Statement,
  FunctionDeclaration,
  VariableDeclaration,
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

export class JavaScriptGenerator {
  private indentLevel = 0;

  public generate(program: Program): string {
    this.indentLevel = 0;
    const lines: string[] = [
      "// MiniLang Compiled to JavaScript",
      '"use strict";',
      "",
    ];

    for (const decl of program.declarations) {
      lines.push(this.generateDeclaration(decl));
    }

    return lines.join("\n");
  }

  private generateDeclaration(decl: Declaration): string {
    switch (decl.kind) {
      case ASTNodeKind.FunctionDeclaration:
        return this.generateFunctionDeclaration(decl);
      case ASTNodeKind.VariableDeclaration:
        return this.generateVariableDeclaration(decl);
      default:
        return this.generateStatement(decl);
    }
  }

  private generateFunctionDeclaration(fn: FunctionDeclaration): string {
    const params = fn.parameters.map((p) => p.name).join(", ");
    const header = `${this.indent()}function ${fn.name}(${params}) {`;
    this.indentLevel++;
    const bodyLines = fn.body.statements.map((s) => this.generateStatement(s));
    this.indentLevel--;
    const footer = `${this.indent()}}`;
    return [header, ...bodyLines, footer, ""].join("\n");
  }

  private generateVariableDeclaration(decl: VariableDeclaration): string {
    if (decl.initializer) {
      const init = this.generateExpression(decl.initializer);
      return `${this.indent()}let ${decl.name} = ${init};`;
    }
    return `${this.indent()}let ${decl.name};`;
  }

  private generateStatement(stmt: Statement): string {
    switch (stmt.kind) {
      case ASTNodeKind.VariableDeclaration:
        return this.generateVariableDeclaration(stmt);

      case ASTNodeKind.AssignmentStatement:
        return `${this.indent()}${stmt.target} = ${this.generateExpression(stmt.value)};`;

      case ASTNodeKind.BlockStatement: {
        const header = `${this.indent()}{`;
        this.indentLevel++;
        const inner = stmt.statements.map((s) => this.generateStatement(s));
        this.indentLevel--;
        return [header, ...inner, `${this.indent()}}`].join("\n");
      }

      case ASTNodeKind.IfStatement:
        return this.generateIfStatement(stmt);

      case ASTNodeKind.WhileStatement: {
        const cond = this.generateExpression(stmt.condition);
        const header = `${this.indent()}while (${cond}) {`;
        this.indentLevel++;
        const body = stmt.body.statements.map((s) => this.generateStatement(s));
        this.indentLevel--;
        return [header, ...body, `${this.indent()}}`].join("\n");
      }

      case ASTNodeKind.ForStatement: {
        let initStr = "";
        if (stmt.initializer) {
          if (stmt.initializer.kind === ASTNodeKind.VariableDeclaration) {
            initStr = `let ${stmt.initializer.name} = ${this.generateExpression(stmt.initializer.initializer!)}`;
          } else {
            initStr = `${stmt.initializer.target} = ${this.generateExpression(stmt.initializer.value)}`;
          }
        }
        const condStr = stmt.condition ? this.generateExpression(stmt.condition) : "";
        let updateStr = "";
        if (stmt.update) {
          if (stmt.update.kind === ASTNodeKind.AssignmentStatement) {
            updateStr = `${stmt.update.target} = ${this.generateExpression(stmt.update.value)}`;
          } else {
            updateStr = this.generateExpression(stmt.update);
          }
        }
        const header = `${this.indent()}for (${initStr}; ${condStr}; ${updateStr}) {`;
        this.indentLevel++;
        const body = stmt.body.statements.map((s) => this.generateStatement(s));
        this.indentLevel--;
        return [header, ...body, `${this.indent()}}`].join("\n");
      }

      case ASTNodeKind.ReturnStatement:
        if (stmt.argument) {
          return `${this.indent()}return ${this.generateExpression(stmt.argument)};`;
        }
        return `${this.indent()}return;`;

      case ASTNodeKind.PrintStatement: {
        const args = stmt.arguments.map((a) => this.generateExpression(a)).join(", ");
        return `${this.indent()}console.log(${args});`;
      }

      case ASTNodeKind.ExpressionStatement:
        return `${this.indent()}${this.generateExpression(stmt.expression)};`;
    }
  }

  private generateIfStatement(stmt: IfStatement): string {
    const cond = this.generateExpression(stmt.condition);
    const header = `${this.indent()}if (${cond}) {`;
    this.indentLevel++;
    const thenBody = stmt.consequent.statements.map((s) => this.generateStatement(s));
    this.indentLevel--;

    if (stmt.alternate) {
      this.indentLevel++;
      const elseBody = stmt.alternate.statements.map((s) => this.generateStatement(s));
      this.indentLevel--;
      return [
        header,
        ...thenBody,
        `${this.indent()}} else {`,
        ...elseBody,
        `${this.indent()}}`,
      ].join("\n");
    }

    return [header, ...thenBody, `${this.indent()}}`].join("\n");
  }

  public generateExpression(expr: Expression): string {
    switch (expr.kind) {
      case ASTNodeKind.LiteralExpression:
        if (expr.literalType === "string") return `"${expr.value}"`;
        return String(expr.value);

      case ASTNodeKind.IdentifierExpression:
        return expr.name;

      case ASTNodeKind.GroupingExpression:
        return `(${this.generateExpression(expr.expression)})`;

      case ASTNodeKind.UnaryExpression:
        return `${expr.operator}${this.generateExpression(expr.operand)}`;

      case ASTNodeKind.BinaryExpression:
        return `${this.generateExpression(expr.left)} ${expr.operator} ${this.generateExpression(expr.right)}`;

      case ASTNodeKind.CallExpression: {
        const args = expr.arguments.map((a) => this.generateExpression(a)).join(", ");
        return `${expr.callee}(${args})`;
      }
    }
  }

  private indent(): string {
    return "  ".repeat(this.indentLevel);
  }
}
