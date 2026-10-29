import * as Comlink from "comlink";
import { compileSource, CompilationArtifacts } from "./compiler-pipeline";
import { OptimizationOptions } from "../../compiler/optimizer/optimizer";

export interface CompilerWorkerAPI {
  compile(
    sourceCode: string,
    optimizerOptions?: Partial<OptimizationOptions>
  ): CompilationArtifacts;
}

const api: CompilerWorkerAPI = {
  compile(sourceCode, optimizerOptions) {
    return compileSource(sourceCode, optimizerOptions);
  },
};

Comlink.expose(api);
