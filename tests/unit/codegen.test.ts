import { describe, it, expect } from "vitest";
import { Lexer } from "../../src/compiler/lexer/lexer";
import { Parser } from "../../src/compiler/parser/parser";
import { BytecodeGenerator } from "../../src/compiler/codegen/bytecode-gen";
import { VirtualMachine } from "../../src/compiler/vm/vm";
import { JavaScriptGenerator } from "../../src/compiler/codegen/js-gen";
import { AssemblyGenerator } from "../../src/compiler/codegen/asm-gen";
import { WatGenerator } from "../../src/compiler/codegen/wat-gen";
import { TACGenerator } from "../../src/compiler/ir/ir-gen";
import { disassembleInstruction } from "../../src/compiler/codegen/bytecode";

describe("Code Generation and Virtual Machine Tests", () => {
  const compileToVM = (code: string): VirtualMachine => {
    const lexer = new Lexer(code);
    const { tokens } = lexer.tokenize();
    const parser = new Parser(tokens);
    const { ast } = parser.parse();
    const byteGen = new BytecodeGenerator();
    const bytecode = byteGen.generate(ast);
    return new VirtualMachine(bytecode);
  };

  const getAST = (code: string) => {
    const lexer = new Lexer(code);
    const { tokens } = lexer.tokenize();
    const parser = new Parser(tokens);
    return parser.parse().ast;
  };

  // 1-3: VM Arithmetic & Variables
  it("executes basic arithmetic and variable assignment in VM", () => {
    const code = `
      int a = 10;
      int b = 25;
      int c = a + b * 2;
      print(c);
    `;
    const vm = compileToVM(code);
    const state = vm.run();
    expect(state.status).toBe("halted");
    expect(state.output).toEqual(["60"]);
    expect(state.globals["c"]).toBe(60);
  });

  it("formats disassembled bytecode cleanly", () => {
    const code = "int a = 5;";
    const ast = getAST(code);
    const byteGen = new BytecodeGenerator();
    const instructions = byteGen.generate(ast);
    const disassembled = instructions.map(disassembleInstruction);
    expect(disassembled[0]).toContain("0000: PUSH_INT");
    expect(disassembled[1]).toContain("0001: STORE");
  });

  // 4-6: Conditionals and Loops
  it("executes if-else statements in VM", () => {
    const code = `
      int x = 15;
      if (x > 10) {
        print("greater");
      } else {
        print("lesser");
      }
    `;
    const vm = compileToVM(code);
    const state = vm.run();
    expect(state.output).toEqual(["greater"]);
  });

  it("executes while loop to calculate sum of 1 to 10", () => {
    const code = `
      int sum = 0;
      int i = 1;
      while (i <= 10) {
        sum = sum + i;
        i = i + 1;
      }
      print(sum);
    `;
    const vm = compileToVM(code);
    const state = vm.run();
    expect(state.output).toEqual(["55"]);
    expect(state.globals["sum"]).toBe(55);
  });

  it("executes for loop in VM", () => {
    const code = `
      int total = 0;
      for (int i = 0; i < 5; i = i + 1) {
        total = total + 2;
      }
      print(total);
    `;
    const vm = compileToVM(code);
    const state = vm.run();
    expect(state.output).toEqual(["10"]);
    expect(state.globals["total"]).toBe(10);
  });

  // 7-9: Functions: Factorial, Fibonacci, Primes
  it("executes recursive factorial in VM: factorial(5) == 120", () => {
    const code = `
      function int factorial(int n) {
        if (n <= 1) {
          return 1;
        }
        return n * factorial(n - 1);
      }

      int result = factorial(5);
      print("Factorial:", result);
    `;
    const vm = compileToVM(code);
    const state = vm.run();
    expect(state.status).toBe("halted");
    expect(state.output).toEqual(["Factorial: 120"]);
    expect(state.globals["result"]).toBe(120);
  });

  it("executes recursive fibonacci in VM: fib(7) == 13", () => {
    const code = `
      function int fib(int n) {
        if (n <= 1) {
          return n;
        }
        return fib(n - 1) + fib(n - 2);
      }

      int ans = fib(7);
      print("Fib:", ans);
    `;
    const vm = compileToVM(code);
    const state = vm.run();
    expect(state.output).toEqual(["Fib: 13"]);
    expect(state.globals["ans"]).toBe(13);
  });

  it("executes prime testing in VM", () => {
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

      bool p7 = isPrime(7);
      bool p9 = isPrime(9);
      print("7 is prime:", p7);
      print("9 is prime:", p9);
    `;
    const vm = compileToVM(code);
    const state = vm.run();
    expect(state.output).toEqual(["7 is prime: true", "9 is prime: false"]);
  });

  // 10-11: Step-by-step & Breakpoints
  it("steps through VM execution one instruction at a time", () => {
    const code = "int a = 10; int b = 20;";
    const vm = compileToVM(code);
    expect(vm.getState().ip).toBe(0);

    const state1 = vm.step();
    expect(state1.ip).toBe(1);
    expect(state1.stack).toEqual([10]);

    const state2 = vm.step();
    expect(state2.ip).toBe(2);
    expect(state2.globals["a"]).toBe(10);
  });

  it("pauses at registered breakpoints", () => {
    const code = "int a = 1; int b = 2; int c = 3;";
    const vm = compileToVM(code);
    vm.addBreakpoint(2);
    const state = vm.run();
    expect(state.status).toBe("paused");
    expect(state.ip).toBe(2);
  });

  // 12-14: Target Generators (JS, ASM, WAT)
  it("generates runnable JavaScript output", () => {
    const code = `
      function int doubleNum(int x) {
        return x * 2;
      }
      int ans = doubleNum(21);
      print(ans);
    `;
    const ast = getAST(code);
    const jsGen = new JavaScriptGenerator();
    const jsCode = jsGen.generate(ast);
    expect(jsCode).toContain("function doubleNum(x)");
    expect(jsCode).toContain("console.log(ans);");
  });

  it("generates valid x86-64 assembly text", () => {
    const code = "int x = 42; int y = x + 1;";
    const ast = getAST(code);
    const irGen = new TACGenerator();
    const tac = irGen.generate(ast);
    const asmGen = new AssemblyGenerator();
    const asm = asmGen.generate(tac);
    expect(asm).toContain(".intel_syntax noprefix");
    expect(asm).toContain("mov");
    expect(asm).toContain("add rax, rbx");
  });

  it("generates WebAssembly Text (WAT) format", () => {
    const code = `
      function int square(int n) {
        return n * n;
      }
    `;
    const ast = getAST(code);
    const watGen = new WatGenerator();
    const wat = watGen.generate(ast);
    expect(wat).toContain("(module");
    expect(wat).toContain('(func $square (export "square") (param $n i32) (result i32)');
    expect(wat).toContain("i32.mul");
  });
});
