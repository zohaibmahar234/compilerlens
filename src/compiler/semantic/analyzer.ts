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
  MiniLangType,
  ASTNodeKind,
} from "../ast/nodes";
import { Span } from "../lexer/tokens";
import { SymbolTable, Symbol } from "./symbol-table";
import { TypeChecker } from "./type-checker";

export interface SemanticDiagnostic {
  message: string;
  span: Span;
  code: string;
  severity: "error" | "warning";
}

export interface SemanticResult {
  errors: SemanticDiagnostic[];
  warnings: SemanticDiagnostic[];
  symbolTable: SymbolTable;
  annotatedAst: Program;
}

export class SemanticAnalyzer {
  private readonly symbolTable: SymbolTable;
  private readonly errors: SemanticDiagnostic[] = [];
  private readonly warnings: SemanticDiagnostic[] = [];
  private currentFunction: FunctionDeclaration | null = null;

  constructor() {
    this.symbolTable = new SymbolTable();
  }

  public analyze(program: Program): SemanticResult {
    this.errors.length = 0;
    this.warnings.length = 0;
    this.currentFunction = null;

    // Pass 1: Register all function declarations into global scope
    for (const decl of program.declarations) {
      if (decl.kind === ASTNodeKind.FunctionDeclaration) {
        this.registerFunction(decl);
      }
    }

    // Pass 2: Analyze all declarations and statements
    for (const decl of program.declarations) {
      this.analyzeDeclaration(decl);
    }

    // Check for unused variables
    this.checkUnusedVariables();

    return {
      errors: this.errors,
      warnings: this.warnings,
      symbolTable: this.symbolTable,
      annotatedAst: program,
    };
  }

  private registerFunction(fn: FunctionDeclaration): void {
    const paramTypes = fn.parameters.map((p) => p.typeNode.name);
    const result = this.symbolTable.define(
      fn.name,
      fn.returnType.name,
      "function",
      fn.span,
      true,
      paramTypes
    );

    if (!result.success) {
      this.reportError(
        `Function '${fn.name}' is already defined in this scope`,
        fn.span,
        "DUPLICATE_FUNCTION"
      );
    }
  }

  private analyzeDeclaration(decl: Declaration): void {
    switch (decl.kind) {
      case ASTNodeKind.FunctionDeclaration:
        this.analyzeFunctionDeclaration(decl);
        break;
      case ASTNodeKind.VariableDeclaration:
        this.analyzeVariableDeclaration(decl);
        break;
      default:
        this.analyzeStatement(decl);
        break;
    }
  }

  private analyzeFunctionDeclaration(fn: FunctionDeclaration): void {
    const prevFunction = this.currentFunction;
    this.currentFunction = fn;

    this.symbolTable.enterScope(`function:${fn.name}`);

    // Define parameters in function scope
    for (const param of fn.parameters) {
      const def = this.symbolTable.define(
        param.name,
        param.typeNode.name,
        "parameter",
        param.span,
        true
      );
      if (!def.success) {
        this.reportError(
          `Duplicate parameter name '${param.name}' in function '${fn.name}'`,
          param.span,
          "DUPLICATE_PARAMETER"
        );
      }
      param.inferredType = param.typeNode.name;
    }

    // Analyze body statements
    for (const stmt of fn.body.statements) {
      this.analyzeStatement(stmt);
    }

    // Return path analysis for non-void functions
    if (fn.returnType.name !== "void") {
      if (!this.checkAllPathsReturn(fn.body)) {
        this.reportError(
          `Function '${fn.name}' with return type '${fn.returnType.name}' must return a value on all code paths`,
          fn.span,
          "MISSING_RETURN"
        );
      }
    }

    this.symbolTable.exitScope();
    this.currentFunction = prevFunction;
  }

  private analyzeVariableDeclaration(decl: VariableDeclaration): void {
    let initType: MiniLangType | undefined = undefined;

    if (decl.initializer) {
      initType = this.analyzeExpression(decl.initializer);
      if (!TypeChecker.areTypesCompatible(decl.typeNode.name, initType)) {
        this.reportError(
          `Type mismatch in variable declaration: cannot assign '${initType}' to '${decl.typeNode.name}'`,
          decl.initializer.span,
          "TYPE_MISMATCH"
        );
      }
    }

    const def = this.symbolTable.define(
      decl.name,
      decl.typeNode.name,
      "variable",
      decl.span,
      decl.initializer !== undefined
    );

    if (!def.success) {
      this.reportError(
        `Variable '${decl.name}' is already declared in this scope`,
        decl.span,
        "DUPLICATE_VARIABLE"
      );
    }

    decl.inferredType = decl.typeNode.name;
  }

  private analyzeStatement(stmt: Statement): void {
    switch (stmt.kind) {
      case ASTNodeKind.VariableDeclaration:
        this.analyzeVariableDeclaration(stmt);
        break;

      case ASTNodeKind.BlockStatement:
        this.symbolTable.enterScope("block");
        for (const s of stmt.statements) {
          this.analyzeStatement(s);
        }
        this.symbolTable.exitScope();
        break;

      case ASTNodeKind.AssignmentStatement:
        this.analyzeAssignment(stmt);
        break;

      case ASTNodeKind.IfStatement:
        this.analyzeIfStatement(stmt);
        break;

      case ASTNodeKind.WhileStatement:
        this.analyzeWhileStatement(stmt);
        break;

      case ASTNodeKind.ForStatement:
        this.analyzeForStatement(stmt);
        break;

      case ASTNodeKind.ReturnStatement:
        this.analyzeReturnStatement(stmt);
        break;

      case ASTNodeKind.PrintStatement:
        for (const arg of stmt.arguments) {
          this.analyzeExpression(arg);
        }
        break;

      case ASTNodeKind.ExpressionStatement:
        this.analyzeExpression(stmt.expression);
        break;
    }
  }

  private analyzeAssignment(stmt: AssignmentStatement): void {
    const symbol = this.symbolTable.lookup(stmt.target);
    const valueType = this.analyzeExpression(stmt.value);

    if (!symbol) {
      this.reportError(
        `Cannot assign to undeclared identifier '${stmt.target}'`,
        stmt.span,
        "UNDECLARED_VARIABLE"
      );
      return;
    }

    if (symbol.kind === "function") {
      this.reportError(
        `Cannot assign to function '${stmt.target}'`,
        stmt.span,
        "CANNOT_ASSIGN_FUNCTION"
      );
      return;
    }

    this.symbolTable.recordReference(stmt.target, stmt.span);
    symbol.isInitialized = true;

    if (!TypeChecker.areTypesCompatible(symbol.type, valueType)) {
      this.reportError(
        `Type mismatch: cannot assign '${valueType}' to variable '${stmt.target}' of type '${symbol.type}'`,
        stmt.value.span,
        "TYPE_MISMATCH"
      );
    }
  }

  private analyzeIfStatement(stmt: IfStatement): void {
    const condType = this.analyzeExpression(stmt.condition);
    if (condType !== "bool" && condType !== "error") {
      this.reportError(
        `If condition must evaluate to 'bool', got '${condType}'`,
        stmt.condition.span,
        "CONDITION_TYPE_ERROR"
      );
    }

    this.symbolTable.enterScope("if_consequent");
    for (const s of stmt.consequent.statements) {
      this.analyzeStatement(s);
    }
    this.symbolTable.exitScope();

    if (stmt.alternate) {
      this.symbolTable.enterScope("if_alternate");
      for (const s of stmt.alternate.statements) {
        this.analyzeStatement(s);
      }
      this.symbolTable.exitScope();
    }
  }

  private analyzeWhileStatement(stmt: WhileStatement): void {
    const condType = this.analyzeExpression(stmt.condition);
    if (condType !== "bool" && condType !== "error") {
      this.reportError(
        `While condition must evaluate to 'bool', got '${condType}'`,
        stmt.condition.span,
        "CONDITION_TYPE_ERROR"
      );
    }

    this.symbolTable.enterScope("while_body");
    for (const s of stmt.body.statements) {
      this.analyzeStatement(s);
    }
    this.symbolTable.exitScope();
  }

  private analyzeForStatement(stmt: ForStatement): void {
    this.symbolTable.enterScope("for_loop");

    if (stmt.initializer) {
      if (stmt.initializer.kind === ASTNodeKind.VariableDeclaration) {
        this.analyzeVariableDeclaration(stmt.initializer);
      } else {
        this.analyzeAssignment(stmt.initializer);
      }
    }

    if (stmt.condition) {
      const condType = this.analyzeExpression(stmt.condition);
      if (condType !== "bool" && condType !== "error") {
        this.reportError(
          `For condition must evaluate to 'bool', got '${condType}'`,
          stmt.condition.span,
          "CONDITION_TYPE_ERROR"
        );
      }
    }

    if (stmt.update) {
      if (stmt.update.kind === ASTNodeKind.AssignmentStatement) {
        this.analyzeAssignment(stmt.update);
      } else {
        this.analyzeExpression(stmt.update);
      }
    }

    for (const s of stmt.body.statements) {
      this.analyzeStatement(s);
    }

    this.symbolTable.exitScope();
  }

  private analyzeReturnStatement(stmt: ReturnStatement): void {
    if (!this.currentFunction) {
      this.reportError(
        `'return' statement outside of function`,
        stmt.span,
        "RETURN_OUTSIDE_FUNCTION"
      );
      return;
    }

    const expectedType = this.currentFunction.returnType.name;

    if (stmt.argument) {
      const actualType = this.analyzeExpression(stmt.argument);
      if (expectedType === "void") {
        this.reportError(
          `Void function '${this.currentFunction.name}' cannot return a value`,
          stmt.span,
          "VOID_FUNCTION_RETURN"
        );
      } else if (!TypeChecker.areTypesCompatible(expectedType, actualType)) {
        this.reportError(
          `Function '${this.currentFunction.name}' expects return type '${expectedType}', got '${actualType}'`,
          stmt.argument.span,
          "RETURN_TYPE_MISMATCH"
        );
      }
    } else {
      if (expectedType !== "void") {
        this.reportError(
          `Non-void function '${this.currentFunction.name}' must return a value of type '${expectedType}'`,
          stmt.span,
          "EMPTY_RETURN"
        );
      }
    }
  }

  // -------------------------------------------------------------
  // Expression Analysis
  // -------------------------------------------------------------

  public analyzeExpression(expr: Expression): MiniLangType {
    let type: MiniLangType = "error";

    switch (expr.kind) {
      case ASTNodeKind.LiteralExpression:
        type = expr.literalType;
        break;

      case ASTNodeKind.IdentifierExpression: {
        const symbol = this.symbolTable.lookup(expr.name);
        if (!symbol) {
          this.reportError(
            `Use of undeclared identifier '${expr.name}'`,
            expr.span,
            "UNDECLARED_IDENTIFIER"
          );
          type = "error";
        } else {
          this.symbolTable.recordReference(expr.name, expr.span);
          if (!symbol.isInitialized && symbol.kind === "variable") {
            this.reportWarning(
              `Variable '${expr.name}' may be used before being initialized`,
              expr.span,
              "UNINITIALIZED_VARIABLE"
            );
          }
          type = symbol.type;
        }
        break;
      }

      case ASTNodeKind.BinaryExpression: {
        const leftType = this.analyzeExpression(expr.left);
        const rightType = this.analyzeExpression(expr.right);
        const opCheck = TypeChecker.checkBinaryOp(expr.operator, leftType, rightType);
        if (opCheck.error) {
          this.reportError(opCheck.error, expr.span, "BINARY_OP_ERROR");
        }
        type = opCheck.resultType;
        break;
      }

      case ASTNodeKind.UnaryExpression: {
        const operandType = this.analyzeExpression(expr.operand);
        const opCheck = TypeChecker.checkUnaryOp(expr.operator, operandType);
        if (opCheck.error) {
          this.reportError(opCheck.error, expr.span, "UNARY_OP_ERROR");
        }
        type = opCheck.resultType;
        break;
      }

      case ASTNodeKind.CallExpression: {
        const symbol = this.symbolTable.lookup(expr.callee);
        if (!symbol) {
          this.reportError(
            `Call to undeclared function '${expr.callee}'`,
            expr.span,
            "UNDECLARED_FUNCTION"
          );
          type = "error";
        } else if (symbol.kind !== "function") {
          this.reportError(
            `'${expr.callee}' is not a function`,
            expr.span,
            "NOT_A_FUNCTION"
          );
          type = "error";
        } else {
          this.symbolTable.recordReference(expr.callee, expr.span);
          const expectedParams = symbol.paramTypes ?? [];
          if (expectedParams.length !== expr.arguments.length) {
            this.reportError(
              `Function '${expr.callee}' expects ${expectedParams.length} arguments, but got ${expr.arguments.length}`,
              expr.span,
              "ARGUMENT_COUNT_MISMATCH"
            );
          } else {
            for (let i = 0; i < expr.arguments.length; i++) {
              const argType = this.analyzeExpression(expr.arguments[i]);
              if (!TypeChecker.areTypesCompatible(expectedParams[i], argType)) {
                this.reportError(
                  `Argument ${i + 1} of '${expr.callee}' expects type '${expectedParams[i]}', got '${argType}'`,
                  expr.arguments[i].span,
                  "ARGUMENT_TYPE_MISMATCH"
                );
              }
            }
          }
          type = symbol.type;
        }
        break;
      }

      case ASTNodeKind.GroupingExpression:
        type = this.analyzeExpression(expr.expression);
        break;
    }

    expr.inferredType = type;
    return type;
  }

  // -------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------

  private checkAllPathsReturn(block: BlockStatement): boolean {
    for (const stmt of block.statements) {
      if (stmt.kind === ASTNodeKind.ReturnStatement) {
        return true;
      }
      if (stmt.kind === ASTNodeKind.IfStatement) {
        if (
          stmt.alternate &&
          this.checkAllPathsReturn(stmt.consequent) &&
          this.checkAllPathsReturn(stmt.alternate)
        ) {
          return true;
        }
      }
    }
    return false;
  }

  private checkUnusedVariables(): void {
    const allSymbols = this.symbolTable.getAllSymbols();
    for (const sym of allSymbols) {
      if (sym.kind === "variable" && sym.references.length === 0) {
        this.reportWarning(
          `Variable '${sym.name}' is declared but its value is never read`,
          sym.span,
          "UNUSED_VARIABLE"
        );
      }
    }
  }

  private reportError(message: string, span: Span, code: string): void {
    this.errors.push({
      message,
      span,
      code,
      severity: "error",
    });
  }

  private reportWarning(message: string, span: Span, code: string): void {
    this.warnings.push({
      message,
      span,
      code,
      severity: "warning",
    });
  }
}
