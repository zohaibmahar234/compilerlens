import { TACInstruction, formatInstruction } from "./tac";

export interface BasicBlock {
  id: string;
  name: string;
  instructions: TACInstruction[];
  predecessors: string[];
  successors: string[];
  dominators?: Set<string>;
  immediateDominator?: string;
}

export interface CFGNodeData {
  id: string;
  name: string;
  code: string[];
  isEntry?: boolean;
  isExit?: boolean;
}

export interface ReactFlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: CFGNodeData;
}

export interface ReactFlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  style?: React.CSSProperties;
}

export class ControlFlowGraph {
  public blocks: Map<string, BasicBlock> = new Map();
  public entryBlockId = "B0";
  public exitBlockId = "";

  public static build(instructions: TACInstruction[]): ControlFlowGraph {
    const cfg = new ControlFlowGraph();
    if (instructions.length === 0) return cfg;

    // 1. Identify Leaders
    const isLeader = new Array<boolean>(instructions.length).fill(false);
    isLeader[0] = true; // First instruction is leader

    const labelToIndex = new Map<string, number>();
    for (let i = 0; i < instructions.length; i++) {
      const inst = instructions[i];
      if (inst.kind === "LABEL") {
        labelToIndex.set(inst.name, i);
        isLeader[i] = true; // Target of jumps is a leader
      }
    }

    for (let i = 0; i < instructions.length; i++) {
      const inst = instructions[i];
      if (
        inst.kind === "JUMP" ||
        inst.kind === "JUMP_IF" ||
        inst.kind === "JUMP_IF_FALSE" ||
        inst.kind === "RETURN"
      ) {
        // Instruction following a jump/return is a leader
        if (i + 1 < instructions.length) {
          isLeader[i + 1] = true;
        }
      }
    }

    // 2. Form Basic Blocks from Leaders
    const leaderIndices: number[] = [];
    for (let i = 0; i < instructions.length; i++) {
      if (isLeader[i]) leaderIndices.push(i);
    }

    const blockList: BasicBlock[] = [];
    const instIndexToBlockId = new Map<number, string>();

    for (let b = 0; b < leaderIndices.length; b++) {
      const start = leaderIndices[b];
      const end =
        b + 1 < leaderIndices.length ? leaderIndices[b + 1] : instructions.length;
      const blockId = `B${b}`;
      const blockInstructions = instructions.slice(start, end);

      const firstInst = blockInstructions[0];
      const blockName =
        firstInst && firstInst.kind === "LABEL" ? firstInst.name : `block_${b}`;

      for (let k = start; k < end; k++) {
        instIndexToBlockId.set(k, blockId);
      }

      const block: BasicBlock = {
        id: blockId,
        name: blockName,
        instructions: blockInstructions,
        predecessors: [],
        successors: [],
      };
      blockList.push(block);
      cfg.blocks.set(blockId, block);
    }

    cfg.entryBlockId = blockList[0]?.id ?? "B0";
    cfg.exitBlockId = blockList[blockList.length - 1]?.id ?? "B0";

    // 3. Connect Predecessors and Successors
    for (let b = 0; b < blockList.length; b++) {
      const block = blockList[b];
      const lastInst = block.instructions[block.instructions.length - 1];

      if (!lastInst) continue;

      if (lastInst.kind === "JUMP") {
        const targetIdx = labelToIndex.get(lastInst.target);
        if (targetIdx !== undefined) {
          const targetBlockId = instIndexToBlockId.get(targetIdx);
          if (targetBlockId) {
            cfg.addEdge(block.id, targetBlockId);
          }
        }
      } else if (
        lastInst.kind === "JUMP_IF" ||
        lastInst.kind === "JUMP_IF_FALSE"
      ) {
        // Branch target
        const targetIdx = labelToIndex.get(lastInst.target);
        if (targetIdx !== undefined) {
          const targetBlockId = instIndexToBlockId.get(targetIdx);
          if (targetBlockId) {
            cfg.addEdge(block.id, targetBlockId);
          }
        }
        // Fall-through successor
        if (b + 1 < blockList.length) {
          cfg.addEdge(block.id, blockList[b + 1].id);
        }
      } else if (lastInst.kind === "RETURN") {
        // No successors (end of function or program)
      } else {
        // Fall-through
        if (b + 1 < blockList.length) {
          cfg.addEdge(block.id, blockList[b + 1].id);
        }
      }
    }

    // 4. Compute Dominators
    cfg.computeDominators();

    return cfg;
  }

  private addEdge(fromId: string, toId: string): void {
    const fromBlock = this.blocks.get(fromId);
    const toBlock = this.blocks.get(toId);

    if (fromBlock && toBlock) {
      if (!fromBlock.successors.includes(toId)) {
        fromBlock.successors.push(toId);
      }
      if (!toBlock.predecessors.includes(fromId)) {
        toBlock.predecessors.push(fromId);
      }
    }
  }

  public computeDominators(): void {
    const allBlockIds = new Set(this.blocks.keys());

    for (const [id, block] of this.blocks.entries()) {
      if (id === this.entryBlockId) {
        block.dominators = new Set([id]);
      } else {
        block.dominators = new Set(allBlockIds);
      }
    }

    let changed = true;
    while (changed) {
      changed = false;
      for (const [id, block] of this.blocks.entries()) {
        if (id === this.entryBlockId) continue;

        let intersection: Set<string> | null = null;
        for (const predId of block.predecessors) {
          const pred = this.blocks.get(predId);
          if (!pred || !pred.dominators) continue;

          if (intersection === null) {
            intersection = new Set(pred.dominators);
          } else {
            const nextIntersection = new Set<string>();
            for (const d of intersection) {
              if (pred.dominators.has(d)) nextIntersection.add(d);
            }
            intersection = nextIntersection;
          }
        }

        const newDoms = new Set(intersection ?? []);
        newDoms.add(id);

        if (block.dominators && !this.areSetsEqual(block.dominators, newDoms)) {
          block.dominators = newDoms;
          changed = true;
        }
      }
    }
  }

  private areSetsEqual(a: Set<string>, b: Set<string>): boolean {
    if (a.size !== b.size) return false;
    for (const item of a) {
      if (!b.has(item)) return false;
    }
    return true;
  }

  public toReactFlow(): { nodes: ReactFlowNode[]; edges: ReactFlowEdge[] } {
    const nodes: ReactFlowNode[] = [];
    const edges: ReactFlowEdge[] = [];
    const blockArray = Array.from(this.blocks.values());

    let yOffset = 50;
    const xBase = 250;

    for (let i = 0; i < blockArray.length; i++) {
      const block = blockArray[i];
      const isEntry = block.id === this.entryBlockId;
      const isExit = block.id === this.exitBlockId;

      const codeLines = block.instructions.map((inst) => formatInstruction(inst));

      nodes.push({
        id: block.id,
        type: "cfgNode",
        position: { x: xBase + (i % 2 === 0 ? 0 : 80), y: yOffset },
        data: {
          id: block.id,
          name: block.name,
          code: codeLines,
          isEntry,
          isExit,
        },
      });

      yOffset += 140 + Math.min(codeLines.length * 20, 160);

      for (const succId of block.successors) {
        edges.push({
          id: `edge_${block.id}_${succId}`,
          source: block.id,
          target: succId,
          animated: true,
        });
      }
    }

    return { nodes, edges };
  }
}
