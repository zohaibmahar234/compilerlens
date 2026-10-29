import { create } from "zustand";
import { EXAMPLES } from "../examples";
import { compileSource, CompilationArtifacts } from "../worker/compiler-pipeline";
import {
  OptimizationOptions,
  DEFAULT_OPTIMIZER_OPTIONS,
} from "../../compiler/optimizer/optimizer";
import { VirtualMachine, VMState } from "../../compiler/vm/vm";
import { Span } from "../../compiler/lexer/tokens";

export type PanelTab =
  | "tokens"
  | "ast"
  | "symbols"
  | "tac"
  | "cfg"
  | "optimizer"
  | "bytecode"
  | "output"
  | "errors";

export interface CompilerStore {
  // Source & Navigation
  code: string;
  activeTab: PanelTab;
  activeTarget: "js" | "asm" | "wat";
  selectedExampleId: string;
  hoveredSpan: Span | null;

  // Compilation state
  isCompiling: boolean;
  artifacts: CompilationArtifacts | null;
  optimizerOptions: OptimizationOptions;

  // VM Execution State
  vm: VirtualMachine | null;
  vmState: VMState | null;
  vmSpeedMs: number;
  isVMRunning: boolean;

  // Actions
  setCode: (code: string) => void;
  setActiveTab: (tab: PanelTab) => void;
  setActiveTarget: (target: "js" | "asm" | "wat") => void;
  setHoveredSpan: (span: Span | null) => void;
  loadExample: (id: string) => void;
  setOptimizerOption: <K extends keyof OptimizationOptions>(
    key: K,
    value: OptimizationOptions[K]
  ) => void;
  compile: () => void;

  // VM Actions
  vmStep: () => void;
  vmRun: () => void;
  vmReset: () => void;
  setVMSpeed: (ms: number) => void;
}

const defaultCode = EXAMPLES[0].code;
const initialArtifacts = compileSource(defaultCode, DEFAULT_OPTIMIZER_OPTIONS);
const initialVM = new VirtualMachine(initialArtifacts.bytecode);

export const useCompilerStore = create<CompilerStore>((set, get) => ({
  code: defaultCode,
  activeTab: "ast",
  activeTarget: "js",
  selectedExampleId: "factorial",
  hoveredSpan: null,

  isCompiling: false,
  artifacts: initialArtifacts,
  optimizerOptions: { ...DEFAULT_OPTIMIZER_OPTIONS },

  vm: initialVM,
  vmState: initialVM.getState(),
  vmSpeedMs: 300,
  isVMRunning: false,

  setCode: (code: string) => {
    set({ code });
    get().compile();
  },

  setActiveTab: (activeTab: PanelTab) => set({ activeTab }),

  setActiveTarget: (activeTarget: "js" | "asm" | "wat") => set({ activeTarget }),

  setHoveredSpan: (hoveredSpan: Span | null) => set({ hoveredSpan }),

  loadExample: (id: string) => {
    const example = EXAMPLES.find((e) => e.id === id);
    if (example) {
      set({ code: example.code, selectedExampleId: id });
      get().compile();
    }
  },

  setOptimizerOption: (key, value) => {
    set((state) => ({
      optimizerOptions: {
        ...state.optimizerOptions,
        [key]: value,
      },
    }));
    get().compile();
  },

  compile: () => {
    set({ isCompiling: true });
    try {
      const { code, optimizerOptions } = get();
      const artifacts = compileSource(code, optimizerOptions);
      const newVM = new VirtualMachine(artifacts.bytecode);
      set({
        artifacts,
        vm: newVM,
        vmState: newVM.getState(),
        isCompiling: false,
      });
    } catch (err) {
      set({ isCompiling: false });
    }
  },

  vmStep: () => {
    const { vm } = get();
    if (vm) {
      const state = vm.step();
      set({ vmState: state });
    }
  },

  vmRun: () => {
    const { vm } = get();
    if (vm) {
      const state = vm.run();
      set({ vmState: state });
    }
  },

  vmReset: () => {
    const { vm } = get();
    if (vm) {
      vm.reset();
      set({ vmState: vm.getState() });
    }
  },

  setVMSpeed: (ms: number) => set({ vmSpeedMs: ms }),
}));
