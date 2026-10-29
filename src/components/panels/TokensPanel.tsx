"use client";

import React, { useState, useMemo } from "react";
import { useCompilerStore } from "@/lib/store/compiler-store";
import { TokenType, Token } from "@/compiler/lexer/tokens";
import { Search, Filter, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function TokensPanel() {
  const { artifacts, setHoveredSpan } = useCompilerStore();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const tokens = artifacts?.tokens ?? [];

  const getCategory = (t: TokenType): string => {
    if (t.includes("LITERAL") || t === TokenType.TRUE || t === TokenType.FALSE) return "LITERAL";
    if (
      [
        TokenType.FUNCTION,
        TokenType.INT,
        TokenType.FLOAT,
        TokenType.BOOL,
        TokenType.STRING,
        TokenType.VOID,
        TokenType.IF,
        TokenType.ELSE,
        TokenType.WHILE,
        TokenType.FOR,
        TokenType.RETURN,
        TokenType.PRINT,
      ].includes(t)
    )
      return "KEYWORD";
    if (
      [
        TokenType.PLUS,
        TokenType.MINUS,
        TokenType.STAR,
        TokenType.SLASH,
        TokenType.PERCENT,
        TokenType.ASSIGN,
        TokenType.EQ,
        TokenType.NOT_EQ,
        TokenType.LT,
        TokenType.LTE,
        TokenType.GT,
        TokenType.GTE,
        TokenType.AND,
        TokenType.OR,
        TokenType.NOT,
      ].includes(t)
    )
      return "OPERATOR";
    if (
      [
        TokenType.LPAREN,
        TokenType.RPAREN,
        TokenType.LBRACE,
        TokenType.RBRACE,
        TokenType.LBRACKET,
        TokenType.RBRACKET,
        TokenType.SEMICOLON,
        TokenType.COMMA,
      ].includes(t)
    )
      return "DELIMITER";
    return "OTHER";
  };

  const getBadgeColor = (category: string) => {
    switch (category) {
      case "KEYWORD":
        return "border-purple-500/40 bg-purple-500/10 text-purple-400";
      case "LITERAL":
        return "border-amber-500/40 bg-amber-500/10 text-amber-400";
      case "OPERATOR":
        return "border-cyan-500/40 bg-cyan-500/10 text-cyan-400";
      case "DELIMITER":
        return "border-slate-500/40 bg-slate-500/10 text-slate-400";
      default:
        return "border-indigo-500/40 bg-indigo-500/10 text-indigo-400";
    }
  };

  const filteredTokens = useMemo(() => {
    return tokens.filter((token) => {
      const cat = getCategory(token.type);
      if (selectedCategory !== "ALL" && cat !== selectedCategory) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        return (
          token.type.toLowerCase().includes(query) ||
          token.value.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [tokens, search, selectedCategory]);

  return (
    <div className="flex flex-col h-full bg-card text-card-foreground">
      {/* Header & Controls */}
      <div className="p-3 border-b border-border/60 flex flex-wrap items-center justify-between gap-2 bg-muted/20">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Hash className="h-3.5 w-3.5 text-primary" />
            Tokens ({tokens.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Search box */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search token or value..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-7 w-40 rounded-md border border-border bg-background pl-7 pr-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-7 rounded-md border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Categories</option>
            <option value="KEYWORD">Keywords</option>
            <option value="LITERAL">Literals</option>
            <option value="OPERATOR">Operators</option>
            <option value="DELIMITER">Delimiters</option>
          </select>
        </div>
      </div>

      {/* Token Stream Table */}
      <div className="flex-1 overflow-auto p-2">
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead>
            <tr className="border-b border-border/40 text-muted-foreground">
              <th className="py-1.5 px-2 font-semibold">#</th>
              <th className="py-1.5 px-2 font-semibold">Type</th>
              <th className="py-1.5 px-2 font-semibold">Value</th>
              <th className="py-1.5 px-2 font-semibold">Line:Col</th>
              <th className="py-1.5 px-2 font-semibold">Span</th>
            </tr>
          </thead>
          <tbody>
            {filteredTokens.map((token, idx) => {
              const cat = getCategory(token.type);
              return (
                <tr
                  key={`${token.type}-${idx}-${token.span.start.offset}`}
                  onMouseEnter={() => setHoveredSpan(token.span)}
                  onMouseLeave={() => setHoveredSpan(null)}
                  className="border-b border-border/20 hover:bg-muted/40 transition-colors cursor-pointer group"
                >
                  <td className="py-1.5 px-2 text-muted-foreground">{idx}</td>
                  <td className="py-1.5 px-2">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getBadgeColor(
                        cat
                      )}`}
                    >
                      {token.type}
                    </span>
                  </td>
                  <td className="py-1.5 px-2 font-semibold text-foreground max-w-[150px] truncate">
                    {token.value === "\n" ? "\\n" : token.value}
                  </td>
                  <td className="py-1.5 px-2 text-muted-foreground text-[11px]">
                    {token.span.start.line}:{token.span.start.column}
                  </td>
                  <td className="py-1.5 px-2 text-muted-foreground text-[11px]">
                    [{token.span.start.offset}..{token.span.end.offset}]
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredTokens.length === 0 && (
          <div className="text-center py-8 text-xs text-muted-foreground">
            No tokens matching current filter
          </div>
        )}
      </div>
    </div>
  );
}
