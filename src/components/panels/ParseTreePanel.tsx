"use client";

import React, { useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import { useCompilerStore } from "@/lib/store/compiler-store";
import { ASTNodeKind } from "@/compiler/ast/nodes";

export function ParseTreePanel() {
  const { artifacts } = useCompilerStore();
  const ast = artifacts?.ast;

  const { nodes, edges } = useMemo(() => {
    if (!ast) return { nodes: [], edges: [] };

    const flowNodes: Node[] = [];
    const flowEdges: Edge[] = [];

    let currentX = 0;
    const HORIZONTAL_SPACING = 160;
    const VERTICAL_SPACING = 90;

    function traverse(node: any, depth: number, parentId?: string): number {
      if (!node || typeof node !== "object") return currentX;

      const nodeId = node.id || `n_${Math.random().toString(36).substring(7)}`;
      const label = node.kind
        ? `${node.kind}${node.name ? `: ${node.name}` : node.value !== undefined ? `: ${node.value}` : ""}`
        : "node";

      // Collect child AST nodes
      const children: any[] = [];
      for (const key of Object.keys(node)) {
        if (key === "span" || key === "id" || key === "inferredType") continue;
        const val = node[key];
        if (Array.isArray(val)) {
          for (const item of val) {
            if (item && typeof item === "object" && item.kind) {
              children.push(item);
            }
          }
        } else if (val && typeof val === "object" && val.kind) {
          children.push(val);
        }
      }

      const childXPositions: number[] = [];
      for (const child of children) {
        const xPos = traverse(child, depth + 1, nodeId);
        childXPositions.push(xPos);
      }

      let myX = currentX;
      if (childXPositions.length > 0) {
        myX = (childXPositions[0] + childXPositions[childXPositions.length - 1]) / 2;
      } else {
        currentX += HORIZONTAL_SPACING;
      }

      flowNodes.push({
        id: nodeId,
        position: { x: myX, y: depth * VERTICAL_SPACING + 40 },
        data: { label },
        style: {
          background: "#1e1e2e",
          color: "#cdd6f4",
          border: "1px solid #6366f1",
          borderRadius: "8px",
          padding: "6px 10px",
          fontSize: "11px",
          fontFamily: "monospace",
          fontWeight: 600,
        },
      });

      if (parentId) {
        flowEdges.push({
          id: `e_${parentId}_${nodeId}`,
          source: parentId,
          target: nodeId,
          style: { stroke: "#818cf8", strokeWidth: 1.5 },
          animated: false,
        });
      }

      return myX;
    }

    traverse(ast, 0);

    return { nodes: flowNodes, edges: flowEdges };
  }, [ast]);

  return (
    <div className="w-full h-full min-h-[400px] bg-[#090d16] relative">
      {nodes.length === 0 ? (
        <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
          No parse tree available. Compile valid code to render tree.
        </div>
      ) : (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          attributionPosition="bottom-right"
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
  );
}
