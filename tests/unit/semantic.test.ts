import { describe, it, expect } from "vitest";
import { Lexer } from "../../src/compiler/lexer/lexer";
import { Parser } from "../../src/compiler/parser/parser";
import { SemanticAnalyzer } from "../../src/compiler/semantic/analyzer";

describe("Semantic Analysis Unit Tests", () => {
  const analyzeCode = (code: string) => {
    const lexer = new Lexer(code);
    const { tokens } = lexer.tokenize();
    const parser = new Parser(tokens);
    const { ast } = parser.parse();
    const analyzer = new SemanticAnalyzer();
    return analyzer.analyze(ast);
  };

  // 1-5: Variable Typing & Scoping
  it("accepts valid primitive variable declarations", () => {
    const code = `
      int a = 10;
      float b = 3.14;
      bool c = true;
      string d = "hello";
    `;
    const { errors } = analyzeCode(code);
    expect(errors.length).toBe(0);
  });

  it("permits float variable initialized with int (widening)", () => {
    const code = "float x = 42;";
    const { errors } = analyzeCode(code);
    expect(errors.length).toBe(0);
  });

  it("reports type mismatch when assigning string to int", () => {
    const code = 'int count = "ten";';
    const { errors } = analyzeCode(code);
    expect(errors.length).toBe(1);
    expect(errors[0].code).toBe("TYPE_MISMATCH");
  });

  it("reports error for duplicate variable declaration in same scope", () => {
    const code = `
      int x = 1;
      int x = 2;
    `;
    const { errors } = analyzeCode(code);
    expect(errors.length).toBe(1);
    expect(errors[0].code).toBe("DUPLICATE_VARIABLE");
  });

  it("allows variable shadowing in nested block", () => {
    const code = `
      int x = 10;
      {
        string x = "shadowed";
        print(x);
      }
      print(x);
    `;
    const { errors } = analyzeCode(code);
    expect(errors.length).toBe(0);
  });

  // 6-10: Undeclared identifiers & assignments
  it("reports error on assigning to undeclared identifier", () => {
    const code = "undeclaredVar = 100;";
    const { errors } = analyzeCode(code);
    expect(errors.length).toBe(1);
    expect(errors[0].code).toBe("UNDECLARED_VARIABLE");
  });

  it("reports error on using undeclared identifier in expression", () => {
    const code = "int a = b + 1;";
    const { errors } = analyzeCode(code);
    expect(errors.length).toBe(1);
    expect(errors[0].code).toBe("UNDECLARED_IDENTIFIER");
  });

  it("reports type mismatch when assigning bool to int variable", () => {
    const code = `
      int a = 5;
      a = true;
    `;
    const { errors } = analyzeCode(code);
    expect(errors.length).toBe(1);
    expect(errors[0].code).toBe("TYPE_MISMATCH");
  });

  it("prohibits assigning to a function identifier", () => {
    const code = `
      function void testFn() {}
      testFn = 42;
    `;
    const { errors } = analyzeCode(code);
    expect(errors.length).toBe(1);
    expect(errors[0].code).toBe("CANNOT_ASSIGN_FUNCTION");
  });

  it("tracks symbol references across scopes", () => {
    const code = `
      int counter = 0;
      counter = counter + 1;
    `;
    const { symbolTable } = analyzeCode(code);
    const sym = symbolTable.lookup("counter");
    expect(sym?.references.length).toBeGreaterThanOrEqual(2);
  });

  // 11-16: Function declarations & returns
  it("accepts valid function declaration and matching return", () => {
    const code = `
      function int addOne(int x) {
        return x + 1;
      }
    `;
    const { errors } = analyzeCode(code);
    expect(errors.length).toBe(0);
  });

  it("reports error when function return type does not match returned value", () => {
    const code = `
      function int badReturn() {
        return "not an int";
      }
    `;
    const { errors } = analyzeCode(code);
    expect(errors.length).toBe(1);
    expect(errors[0].code).toBe("RETURN_TYPE_MISMATCH");
  });

  it("reports error when void function returns a value", () => {
    const code = `
      function void doVoid() {
        return 123;
      }
    `;
    const { errors } = analyzeCode(code);
    expect(errors.length).toBe(1);
    expect(errors[0].code).toBe("VOID_FUNCTION_RETURN");
  });

  it("reports error when non-void function is missing a return statement", () => {
    const code = `
      function int missingReturn() {
        int x = 10;
      }
    `;
    const { errors } = analyzeCode(code);
    expect(errors.length).toBe(1);
    expect(errors[0].code).toBe("MISSING_RETURN");
  });

  it("accepts non-void function when both if and else return", () => {
    const code = `
      function int choose(bool flag) {
        if (flag) {
          return 1;
        } else {
          return 0;
        }
      }
    `;
    const { errors } = analyzeCode(code);
    expect(errors.length).toBe(0);
  });

  it("reports error on return statement outside of a function", () => {
    const code = "return 42;";
    const { errors } = analyzeCode(code);
    expect(errors.length).toBe(1);
    expect(errors[0].code).toBe("RETURN_OUTSIDE_FUNCTION");
  });

  // 17-22: Function calls & parameters
  it("accepts valid function calls", () => {
    const code = `
      function int multiply(int a, int b) {
        return a * b;
      }
      int result = multiply(3, 4);
    `;
    const { errors } = analyzeCode(code);
    expect(errors.length).toBe(0);
  });

  it("reports error when function call has too few arguments", () => {
    const code = `
      function int multiply(int a, int b) {
        return a * b;
      }
      int result = multiply(3);
    `;
    const { errors } = analyzeCode(code);
    expect(errors.length).toBe(1);
    expect(errors[0].code).toBe("ARGUMENT_COUNT_MISMATCH");
  });

  it("reports error when function call has too many arguments", () => {
    const code = `
      function int square(int a) {
        return a * a;
      }
      int result = square(3, 4, 5);
    `;
    const { errors } = analyzeCode(code);
    expect(errors.length).toBe(1);
    expect(errors[0].code).toBe("ARGUMENT_COUNT_MISMATCH");
  });

  it("reports error on argument type mismatch in function call", () => {
    const code = `
      function void greet(string name) {}
      greet(12345);
    `;
    const { errors } = analyzeCode(code);
    expect(errors.length).toBe(1);
    expect(errors[0].code).toBe("ARGUMENT_TYPE_MISMATCH");
  });

  it("reports error when calling an undeclared function", () => {
    const code = "calc();";
    const { errors } = analyzeCode(code);
    expect(errors.length).toBe(1);
    expect(errors[0].code).toBe("UNDECLARED_FUNCTION");
  });

  it("reports error when attempting to call a non-function variable", () => {
    const code = `
      int notCallable = 10;
      notCallable();
    `;
    const { errors } = analyzeCode(code);
    expect(errors.length).toBe(1);
    expect(errors[0].code).toBe("NOT_A_FUNCTION");
  });

  // 23-25: Condition Expressions
  it("reports error when if condition is non-boolean", () => {
    const code = `
      if (123) {
        print("not bool");
      }
    `;
    const { errors } = analyzeCode(code);
    expect(errors.length).toBe(1);
    expect(errors[0].code).toBe("CONDITION_TYPE_ERROR");
  });

  it("reports error when while condition is non-boolean", () => {
    const code = `
      while ("string") {
        print("loop");
      }
    `;
    const { errors } = analyzeCode(code);
    expect(errors.length).toBe(1);
    expect(errors[0].code).toBe("CONDITION_TYPE_ERROR");
  });

  it("reports error when for condition is non-boolean", () => {
    const code = `
      for (int i = 0; 42; i = i + 1) {}
    `;
    const { errors } = analyzeCode(code);
    expect(errors.length).toBe(1);
    expect(errors[0].code).toBe("CONDITION_TYPE_ERROR");
  });

  // 26-30: Operators
  it("validates arithmetic operations and string concatenation", () => {
    const code = `
      int n = 1 + 2 * 3;
      string s = "count: " + 5;
    `;
    const { errors } = analyzeCode(code);
    expect(errors.length).toBe(0);
  });

  it("reports error for invalid arithmetic operand types", () => {
    const code = `
      bool b = true;
      int x = b * 5;
    `;
    const { errors } = analyzeCode(code);
    expect(errors.length).toBe(1);
    expect(errors[0].code).toBe("BINARY_OP_ERROR");
  });

  it("reports error for modulo on floats", () => {
    const code = `
      float f = 3.5;
      float r = f % 2;
    `;
    const { errors } = analyzeCode(code);
    expect(errors.length).toBe(1);
    expect(errors[0].code).toBe("BINARY_OP_ERROR");
  });

  it("reports error for logical NOT applied to integer", () => {
    const code = `
      int x = 10;
      bool b = !x;
    `;
    const { errors } = analyzeCode(code);
    expect(errors.length).toBe(1);
    expect(errors[0].code).toBe("UNARY_OP_ERROR");
  });

  it("reports warning for unused variables", () => {
    const code = "int unusedVar = 100;";
    const { warnings } = analyzeCode(code);
    expect(warnings.length).toBe(1);
    expect(warnings[0].code).toBe("UNUSED_VARIABLE");
  });

  it("supports mutual recursion / forward function invocation", () => {
    const code = `
      function bool isEven(int n) {
        if (n == 0) {
          return true;
        }
        return isOdd(n - 1);
      }

      function bool isOdd(int n) {
        if (n == 0) {
          return false;
        }
        return isEven(n - 1);
      }
    `;
    const { errors } = analyzeCode(code);
    expect(errors.length).toBe(0);
  });
});
