"use client";

import React, { useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  NodeProps,
} from "reactflow";
import "reactflow/dist/style.css";
import { useCompilerStore } from "@/lib/store/compiler-store";
import { Layers } from "lucide-react";

// Custom Node for Basic Blocks in CFG
function CFGBasicBlockNode({ data }: NodeProps) {
  return (
    <div className="rounded-xl border border-primary/40 bg-card shadow-xl text-xs font-mono min-w-[200px] overflow-hidden">
      <Handle type="target" position={Position.Top} className="!bg-primary !w-2.5 !h-2.5" />

      {/* Header */}
      <div className="bg-primary/10 border-b border-primary/30 px-3 py-1.5 flex items-center justify-between">
        <span className="font-bold text-primary">{data.name}</span>
        <span className="text-[10px] text-muted-foreground uppercase">{data.id}</span>
      </div>

      {/* Instructions list */}
      <div className="p-2.5 space-y-1 text-slate-300">
        {data.code.length === 0 ? (
          <span className="text-muted-foreground italic">(empty block)</span>
        ) : (
          data.code.map((line: string, idx: number) => (
            <div key={idx} className="truncate">
              {line}
            </div>
          ))
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-primary !w-2.5 !h-2.5" />
    </div>
  );
}

const nodeTypes = {
  cfgNode: CFGBasicBlockNode,
};

export function CFGPanel() {
  const { artifacts } = useCompilerStore();
  const cfg = artifacts?.cfg;

  const { nodes, edges } = useMemo(() => {
    if (!cfg) return { nodes: [], edges: [] };
    return cfg.toReactFlow();
  }, [cfg]);

  return (
    <div className="w-full h-full min-h-[400px] bg-[#090d16] relative flex flex-col">
      <div className="p-2 border-b border-border/40 bg-muted/10 flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5 font-semibold text-primary">
          <Layers className="h-3.5 w-3.5" /> Control Flow Graph ({nodes.length} Blocks)
        </span>
        <span className="text-[11px]">Entry: {cfg?.entryBlockId ?? "B0"}</span>
      </div>

      <div className="flex-1 w-full h-full">
        {nodes.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
            No Control Flow Graph available. Compile code to generate blocks.
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
          >
            <Background color="#1e293b" gap={16} size={1} />
            <Controls className="bg-card border-border fill-foreground text-foreground" />
            <MiniMap
              nodeColor="#6366f1"
              maskColor="rgba(0, 0, 0, 0.7)"
              className="border border-border rounded-lg"
            />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}
