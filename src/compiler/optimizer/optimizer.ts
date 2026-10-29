import { TACInstruction, formatInstruction } from "../ir/tac";
import { ConstantFolding } from "./constant-folding";
import { ConstantPropagation } from "./constant-propagation";
import { AlgebraicSimplification } from "./algebraic";
import { CommonSubexpressionElimination } from "./cse";
import { DeadCodeElimination } from "./dead-code";
import { LoopInvariantCodeMotion } from "./loop-invariant";

export interface OptimizationOptions {
  constantFolding: boolean;
  constantPropagation: boolean;
  algebraicSimplification: boolean;
  commonSubexpressionElimination: boolean;
  deadCodeElimination: boolean;
  loopInvariantCodeMotion: boolean;
  maxIterations?: number;
}

export const DEFAULT_OPTIMIZER_OPTIONS: OptimizationOptions = {
  constantFolding: true,
  constantPropagation: true,
  algebraicSimplification: true,
  commonSubexpressionElimination: true,
  deadCodeElimination: true,
  loopInvariantCodeMotion: true,
  maxIterations: 5,
};

export interface OptimizationPassRecord {
  passName: string;
  changesCount: number;
  beforeCode: string[];
  afterCode: string[];
}

export interface OptimizerResult {
  optimizedInstructions: TACInstruction[];
  totalChanges: number;
  passes: OptimizationPassRecord[];
}

export class Optimizer {
  public static optimize(
    instructions: TACInstruction[],
    options: Partial<OptimizationOptions> = {}
  ): OptimizerResult {
    const opts = { ...DEFAULT_OPTIMIZER_OPTIONS, ...options };
    const maxIter = opts.maxIterations ?? 5;
    const passes: OptimizationPassRecord[] = [];
    let current = [...instructions];
    let totalChanges = 0;

    const runPass = (
      name: string,
      fn: (insts: TACInstruction[]) => {
        instructions: TACInstruction[];
        changesCount: number;
      }
    ) => {
      const beforeCode = current.map(formatInstruction);
      const res = fn(current);
      const afterCode = res.instructions.map(formatInstruction);

      if (res.changesCount > 0) {
        passes.push({
          passName: name,
          changesCount: res.changesCount,
          beforeCode,
          afterCode,
        });
        current = res.instructions;
        totalChanges += res.changesCount;
      }
    };

    for (let iter = 0; iter < maxIter; iter++) {
      const changesBeforeIter = totalChanges;

      if (opts.constantFolding) {
        runPass("Constant Folding", (insts) => ConstantFolding.optimize(insts));
      }

      if (opts.constantPropagation) {
        runPass("Constant Propagation", (insts) => ConstantPropagation.optimize(insts));
      }

      if (opts.algebraicSimplification) {
        runPass("Algebraic Simplification", (insts) => AlgebraicSimplification.optimize(insts));
      }

      if (opts.commonSubexpressionElimination) {
        runPass("Common Subexpression Elimination", (insts) => CommonSubexpressionElimination.optimize(insts));
      }

      if (opts.loopInvariantCodeMotion) {
        runPass("Loop Invariant Code Motion", (insts) => LoopInvariantCodeMotion.optimize(insts));
      }

      if (opts.deadCodeElimination) {
        runPass("Dead Code Elimination", (insts) => DeadCodeElimination.optimize(insts));
      }

      // If no changes occurred in this full round of passes, we reached convergence!
      if (totalChanges === changesBeforeIter) {
        break;
      }
    }

    return {
      optimizedInstructions: current,
      totalChanges,
      passes,
    };
  }
}
