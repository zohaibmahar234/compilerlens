import { Lexer, LexerError } from "../../compiler/lexer/lexer";
import { Token } from "../../compiler/lexer/tokens";
import { Parser } from "../../compiler/parser/parser";
import { ParserError } from "../../compiler/parser/error-recovery";
import { Program } from "../../compiler/ast/nodes";
import { SemanticAnalyzer, SemanticDiagnostic } from "../../compiler/semantic/analyzer";
import { SymbolTable } from "../../compiler/semantic/symbol-table";
import { TACGenerator } from "../../compiler/ir/ir-gen";
import { TACProgram } from "../../compiler/ir/tac";
import { ControlFlowGraph } from "../../compiler/ir/cfg";
import { Optimizer, OptimizerResult, OptimizationOptions, DEFAULT_OPTIMIZER_OPTIONS } from "../../compiler/optimizer/optimizer";
import { BytecodeGenerator } from "../../compiler/codegen/bytecode-gen";
import { BytecodeInstruction } from "../../compiler/codegen/bytecode";
import { JavaScriptGenerator } from "../../compiler/codegen/js-gen";
import { AssemblyGenerator } from "../../compiler/codegen/asm-gen";
import { WatGenerator } from "../../compiler/codegen/wat-gen";
import { VirtualMachine, VMState } from "../../compiler/vm/vm";

export interface CompilationArtifacts {
  sourceCode: string;
  tokens: Token[];
  comments: Token[];
  lexerErrors: LexerError[];
  ast: Program | null;
  parserErrors: ParserError[];
  semanticErrors: SemanticDiagnostic[];
  semanticWarnings: SemanticDiagnostic[];
  symbolTable: SymbolTable | null;
  tacProgram: TACProgram | null;
  cfg: ControlFlowGraph | null;
  optimizerResult: OptimizerResult | null;
  bytecode: BytecodeInstruction[];
  jsCode: string;
  asmCode: string;
  watCode: string;
  vmInitialState: VMState | null;
  totalErrors: number;
}

export function compileSource(
  sourceCode: string,
  optimizerOptions: Partial<OptimizationOptions> = DEFAULT_OPTIMIZER_OPTIONS
): CompilationArtifacts {
  // 1. Lexical Analysis
  const lexer = new Lexer(sourceCode);
  const { tokens, errors: lexerErrors, comments } = lexer.tokenize(true);

  // 2. Syntax Analysis (Parser)
  const parser = new Parser(tokens);
  const { ast, errors: parserErrors } = parser.parse();

  // 3. Semantic Analysis
  let semanticErrors: SemanticDiagnostic[] = [];
  let semanticWarnings: SemanticDiagnostic[] = [];
  let symbolTable: SymbolTable | null = null;

  if (ast) {
    const analyzer = new SemanticAnalyzer();
    const semResult = analyzer.analyze(ast);
    semanticErrors = semResult.errors;
    semanticWarnings = semResult.warnings;
    symbolTable = semResult.symbolTable;
  }

  const totalErrors = lexerErrors.length + parserErrors.length + semanticErrors.length;

  // 4. TAC IR & CFG Generation
  let tacProgram: TACProgram | null = null;
  let cfg: ControlFlowGraph | null = null;
  let optimizerResult: OptimizerResult | null = null;

  if (ast) {
    const tacGen = new TACGenerator();
    tacProgram = tacGen.generate(ast);
    cfg = ControlFlowGraph.build(tacProgram.instructions);

    // 5. Optimization
    optimizerResult = Optimizer.optimize(tacProgram.instructions, optimizerOptions);
  }

  // 6. Code Generation (Bytecode, JS, ASM, WAT) & VM init
  let bytecode: BytecodeInstruction[] = [];
  let jsCode = "";
  let asmCode = "";
  let watCode = "";
  let vmInitialState: VMState | null = null;

  if (ast) {
    const byteGen = new BytecodeGenerator();
    bytecode = byteGen.generate(ast);

    const jsGen = new JavaScriptGenerator();
    jsCode = jsGen.generate(ast);

    if (tacProgram) {
      const asmGen = new AssemblyGenerator();
      asmCode = asmGen.generate(
        optimizerResult ? { instructions: optimizerResult.optimizedInstructions } : tacProgram
      );
    }

    const watGen = new WatGenerator();
    watCode = watGen.generate(ast);

    const vm = new VirtualMachine(bytecode);
    vmInitialState = vm.getState();
  }

  return {
    sourceCode,
    tokens,
    comments,
    lexerErrors,
    ast,
    parserErrors,
    semanticErrors,
    semanticWarnings,
    symbolTable,
    tacProgram,
    cfg,
    optimizerResult,
    bytecode,
    jsCode,
    asmCode,
    watCode,
    vmInitialState,
    totalErrors,
  };
}
