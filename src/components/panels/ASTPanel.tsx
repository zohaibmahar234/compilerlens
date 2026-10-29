"use client";

import React, { useState } from "react";
import { useCompilerStore } from "@/lib/store/compiler-store";
import { ChevronRight, ChevronDown, GitBranch, Code, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ASTNodeProps {
  node: any;
  keyName?: string;
  depth?: number;
}

function ASTNodeView({ node, keyName, depth = 0 }: ASTNodeProps) {
  const [isOpen, setIsOpen] = useState(depth < 3);
  const { setHoveredSpan } = useCompilerStore();

  if (node === null || node === undefined) {
    return (
      <div className="font-mono text-xs py-0.5" style={{ paddingLeft: `${depth * 16}px` }}>
        {keyName && <span className="text-muted-foreground">{keyName}: </span>}
        <span className="text-muted-foreground/60">null</span>
      </div>
    );
  }

  if (typeof node !== "object") {
    let valColor = "text-emerald-400";
    if (typeof node === "number") valColor = "text-amber-400";
    if (typeof node === "boolean") valColor = "text-purple-400";

    return (
      <div className="font-mono text-xs py-0.5" style={{ paddingLeft: `${depth * 16}px` }}>
        {keyName && <span className="text-muted-foreground">{keyName}: </span>}
        <span className={valColor}>{String(node)}</span>
      </div>
    );
  }

  if (Array.isArray(node)) {
    return (
      <div className="font-mono text-xs">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 py-0.5 cursor-pointer hover:bg-muted/30 rounded select-none"
          style={{ paddingLeft: `${depth * 16}px` }}
        >
          {isOpen ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          {keyName && <span className="text-muted-foreground font-semibold">{keyName}: </span>}
          <span className="text-muted-foreground text-[11px]">Array[{node.length}]</span>
        </div>
        {isOpen && (
          <div>
            {node.map((item, index) => (
              <ASTNodeView
                key={index}
                node={item}
                keyName={`[${index}]`}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Object / AST Node
  const isAstNode = Boolean(node.kind);
  const keys = Object.keys(node).filter(
    (k) => k !== "span" && k !== "id" && k !== "inferredType"
  );

  return (
    <div className="font-mono text-xs">
      <div
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => node.span && setHoveredSpan(node.span)}
        onMouseLeave={() => setHoveredSpan(null)}
        className="flex items-center gap-1.5 py-0.5 cursor-pointer hover:bg-muted/30 rounded select-none group"
        style={{ paddingLeft: `${depth * 16}px` }}
      >
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        )}

        {keyName && <span className="text-muted-foreground">{keyName}: </span>}

        {isAstNode ? (
          <span className="font-semibold text-primary group-hover:underline">
            {node.kind}
          </span>
        ) : (
          <span className="text-muted-foreground">Object</span>
        )}

        {node.inferredType && (
          <span className="text-[10px] px-1.5 py-0.2 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
            type: {node.inferredType}
          </span>
        )}

        {node.span && (
          <span className="text-[10px] text-muted-foreground/60 ml-auto mr-2">
            L{node.span.start.line}:{node.span.start.column}
          </span>
        )}
      </div>

      {isOpen && (
        <div>
          {keys.map((k) => (
            <ASTNodeView
              key={k}
              node={node[k]}
              keyName={k}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ASTPanel() {
  const { artifacts } = useCompilerStore();
  const [viewJson, setViewJson] = useState(false);

  const ast = artifacts?.ast;

  return (
    <div className="flex flex-col h-full bg-card text-card-foreground">
      {/* Header */}
      <div className="p-3 border-b border-border/60 flex items-center justify-between bg-muted/20">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Abstract Syntax Tree (AST)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewJson(!viewJson)}
            className="h-7 text-xs flex items-center gap-1.5"
          >
            {viewJson ? (
              <>
                <Eye className="h-3.5 w-3.5" /> Tree View
              </>
            ) : (
              <>
                <Code className="h-3.5 w-3.5" /> Raw JSON
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3">
        {!ast ? (
          <div className="text-center py-10 text-xs text-muted-foreground">
            No valid AST generated. Fix parsing errors to view tree.
          </div>
        ) : viewJson ? (
          <pre className="font-mono text-xs text-slate-300 leading-relaxed overflow-auto">
            {JSON.stringify(ast, null, 2)}
          </pre>
        ) : (
          <div className="py-1">
            <ASTNodeView node={ast} />
          </div>
        )}
      </div>
    </div>
  );
}
