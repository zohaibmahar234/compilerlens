import { describe, it, expect } from "vitest";
import { Lexer } from "../../src/compiler/lexer/lexer";
import { Parser } from "../../src/compiler/parser/parser";
import {
  ASTNodeKind,
  VariableDeclaration,
  FunctionDeclaration,
  BinaryExpression,
  IfStatement,
  WhileStatement,
  ForStatement,
  ReturnStatement,
  PrintStatement,
} from "../../src/compiler/ast/nodes";

describe("Parser Unit Tests", () => {
  const parseCode = (code: string) => {
    const lexer = new Lexer(code);
    const { tokens } = lexer.tokenize();
    const parser = new Parser(tokens);
    return parser.parse();
  };

  it("parses variable declaration without initializer", () => {
    const { ast, errors } = parseCode("int count;");
    expect(errors.length).toBe(0);
    expect(ast.declarations.length).toBe(1);

    const decl = ast.declarations[0] as VariableDeclaration;
    expect(decl.kind).toBe(ASTNodeKind.VariableDeclaration);
    expect(decl.typeNode.name).toBe("int");
    expect(decl.name).toBe("count");
    expect(decl.initializer).toBeUndefined();
  });

  it("parses variable declaration with initializer", () => {
    const { ast, errors } = parseCode('string message = "hello";');
    expect(errors.length).toBe(0);
    const decl = ast.declarations[0] as VariableDeclaration;
    expect(decl.kind).toBe(ASTNodeKind.VariableDeclaration);
    expect(decl.typeNode.name).toBe("string");
    expect(decl.name).toBe("message");
    expect(decl.initializer?.kind).toBe(ASTNodeKind.LiteralExpression);
  });

  it("parses function declaration with zero parameters", () => {
    const { ast, errors } = parseCode("function void doNothing() {}");
    expect(errors.length).toBe(0);
    const fn = ast.declarations[0] as FunctionDeclaration;
    expect(fn.kind).toBe(ASTNodeKind.FunctionDeclaration);
    expect(fn.name).toBe("doNothing");
    expect(fn.returnType.name).toBe("void");
    expect(fn.parameters.length).toBe(0);
    expect(fn.body.statements.length).toBe(0);
  });

  it("parses function declaration with multiple typed parameters", () => {
    const { ast, errors } = parseCode(
      "function int add(int a, float b) { return 0; }"
    );
    expect(errors.length).toBe(0);
    const fn = ast.declarations[0] as FunctionDeclaration;
    expect(fn.name).toBe("add");
    expect(fn.parameters.length).toBe(2);
    expect(fn.parameters[0].name).toBe("a");
    expect(fn.parameters[0].typeNode.name).toBe("int");
    expect(fn.parameters[1].name).toBe("b");
    expect(fn.parameters[1].typeNode.name).toBe("float");
  });

  it("parses return statement with expression", () => {
    const { ast, errors } = parseCode("return x + 1;");
    expect(errors.length).toBe(0);
    const ret = ast.declarations[0] as ReturnStatement;
    expect(ret.kind).toBe(ASTNodeKind.ReturnStatement);
    expect(ret.argument?.kind).toBe(ASTNodeKind.BinaryExpression);
  });

  it("parses return statement without expression", () => {
    const { ast, errors } = parseCode("return;");
    expect(errors.length).toBe(0);
    const ret = ast.declarations[0] as ReturnStatement;
    expect(ret.kind).toBe(ASTNodeKind.ReturnStatement);
    expect(ret.argument).toBeUndefined();
  });

  it("parses print statement with multiple arguments", () => {
    const { ast, errors } = parseCode('print("Sum:", a + b, true);');
    expect(errors.length).toBe(0);
    const print = ast.declarations[0] as PrintStatement;
    expect(print.kind).toBe(ASTNodeKind.PrintStatement);
    expect(print.arguments.length).toBe(3);
  });

  it("parses assignment statement", () => {
    const { ast, errors } = parseCode("total = total + item;");
    expect(errors.length).toBe(0);
    expect(ast.declarations[0].kind).toBe(ASTNodeKind.AssignmentStatement);
  });

  it("parses if statement with else clause", () => {
    const { ast, errors } = parseCode(`
      if (x > 0) {
        print("positive");
      } else {
        print("non-positive");
      }
    `);
    expect(errors.length).toBe(0);
    const ifStmt = ast.declarations[0] as IfStatement;
    expect(ifStmt.kind).toBe(ASTNodeKind.IfStatement);
    expect(ifStmt.alternate).toBeDefined();
    expect(ifStmt.alternate?.statements.length).toBe(1);
  });

  it("parses else-if chained conditional", () => {
    const { ast, errors } = parseCode(`
      if (x > 0) {
        y = 1;
      } else if (x < 0) {
        y = -1;
      } else {
        y = 0;
      }
    `);
    expect(errors.length).toBe(0);
    const ifStmt = ast.declarations[0] as IfStatement;
    expect(ifStmt.alternate).toBeDefined();
    expect(ifStmt.alternate?.statements[0].kind).toBe(ASTNodeKind.IfStatement);
  });

  it("parses while loop statement", () => {
    const { ast, errors } = parseCode(`
      while (i < 10) {
        i = i + 1;
      }
    `);
    expect(errors.length).toBe(0);
    const whileStmt = ast.declarations[0] as WhileStatement;
    expect(whileStmt.kind).toBe(ASTNodeKind.WhileStatement);
    expect(whileStmt.body.statements.length).toBe(1);
  });

  it("parses for loop with variable declaration initializer", () => {
    const { ast, errors } = parseCode(`
      for (int i = 0; i < 10; i = i + 1) {
        print(i);
      }
    `);
    expect(errors.length).toBe(0);
    const forStmt = ast.declarations[0] as ForStatement;
    expect(forStmt.kind).toBe(ASTNodeKind.ForStatement);
    expect(forStmt.initializer?.kind).toBe(ASTNodeKind.VariableDeclaration);
    expect(forStmt.condition).toBeDefined();
    expect(forStmt.update).toBeDefined();
  });

  it("respects operator precedence: multiplication over addition", () => {
    const { ast, errors } = parseCode("result = 2 + 3 * 4;");
    expect(errors.length).toBe(0);
    // Tree should be + with left: 2, right: (3 * 4)
    const assign = ast.declarations[0] as any;
    const expr = assign.value as BinaryExpression;
    expect(expr.operator).toBe("+");
    expect(expr.left.kind).toBe(ASTNodeKind.LiteralExpression);
    expect(expr.right.kind).toBe(ASTNodeKind.BinaryExpression);
    expect((expr.right as BinaryExpression).operator).toBe("*");
  });

  it("respects operator precedence: comparison over equality and logical AND", () => {
    const { ast, errors } = parseCode("bool val = a + 1 > b && c == d;");
    expect(errors.length).toBe(0);
    const decl = ast.declarations[0] as VariableDeclaration;
    const expr = decl.initializer as BinaryExpression;
    expect(expr.operator).toBe("&&");
    expect((expr.left as BinaryExpression).operator).toBe(">");
    expect((expr.right as BinaryExpression).operator).toBe("==");
  });

  it("respects parentheses grouping override", () => {
    const { ast, errors } = parseCode("x = (2 + 3) * 4;");
    expect(errors.length).toBe(0);
    const assign = ast.declarations[0] as any;
    const expr = assign.value as BinaryExpression;
    expect(expr.operator).toBe("*");
    expect(expr.left.kind).toBe(ASTNodeKind.GroupingExpression);
  });

  it("parses unary NOT and unary minus expressions", () => {
    const { ast, errors } = parseCode("bool flag = !isValid; int neg = -count;");
    expect(errors.length).toBe(0);
    expect(ast.declarations.length).toBe(2);
    const d1 = ast.declarations[0] as VariableDeclaration;
    expect(d1.initializer?.kind).toBe(ASTNodeKind.UnaryExpression);
  });

  it("parses function call expressions with arguments", () => {
    const { ast, errors } = parseCode("int f = fib(n - 1, true);");
    expect(errors.length).toBe(0);
    const decl = ast.declarations[0] as VariableDeclaration;
    expect(decl.initializer?.kind).toBe(ASTNodeKind.CallExpression);
  });

  it("recovers from missing semicolon and parses subsequent statements", () => {
    const code = `
      int a = 10
      int b = 20;
    `;
    const { ast, errors } = parseCode(code);
    expect(errors.length).toBeGreaterThan(0);
    // Error recovery should allow parsing int b = 20;
    expect(ast.declarations.length).toBeGreaterThanOrEqual(1);
  });

  it("parses complete recursive factorial program", () => {
    const code = `
      function int factorial(int n) {
        if (n <= 1) {
          return 1;
        }
        return n * factorial(n - 1);
      }
      int ans = factorial(5);
    `;
    const { ast, errors } = parseCode(code);
    expect(errors.length).toBe(0);
    expect(ast.declarations.length).toBe(2);
  });

  it("parses prime testing loop with nested statements", () => {
    const code = `
      function bool isPrime(int n) {
        if (n <= 1) {
          return false;
        }
        int i = 2;
        while (i * i <= n) {
          if (n % i == 0) {
            return false;
          }
          i = i + 1;
        }
        return true;
      }
    `;
    const { ast, errors } = parseCode(code);
    expect(errors.length).toBe(0);
    expect(ast.declarations.length).toBe(1);
  });
});
