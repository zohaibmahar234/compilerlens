"use client";

import React, { useEffect, useRef } from "react";
import Editor, { Monaco, OnMount } from "@monaco-editor/react";
import { useCompilerStore } from "@/lib/store/compiler-store";

export function CodeEditor() {
  const { code, setCode, artifacts } = useCompilerStore();
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Register MiniLang language
    monaco.languages.register({ id: "minilang" });

    // Register monarch syntax tokens
    monaco.languages.setMonarchTokensProvider("minilang", {
      keywords: [
        "function",
        "if",
        "else",
        "while",
        "for",
        "return",
        "print",
        "true",
        "false",
      ],
      typeKeywords: ["int", "float", "bool", "string", "void"],
      operators: [
        "=",
        ">",
        "<",
        "!",
        "==",
        "<=",
        ">=",
        "!=",
        "&&",
        "||",
        "+",
        "-",
        "*",
        "/",
        "%",
      ],
      tokenizer: {
        root: [
          // Identifiers and keywords
          [
            /[a-zA-Z_]\w*/,
            {
              cases: {
                "@typeKeywords": "type",
                "@keywords": "keyword",
                "@default": "identifier",
              },
            },
          ],

          // Whitespace
          { include: "@whitespace" },

          // Numbers
          [/\d*\.\d+([eE][\-+]?\d+)?/, "number.float"],
          [/\d+/, "number"],

          // Delimiters and operators
          [/[{}()\[\]]/, "@brackets"],
          [/[;,]/, "delimiter"],
          [
            /@operators/,
            {
              cases: {
                "@operators": "operator",
                "@default": "",
              },
            },
          ],

          // Strings
          [/"([^"\\]|\\.)*$/, "string.invalid"], // non-teminated
          [/"/, { token: "string.quote", bracket: "@open", next: "@string" }],
        ],

        string: [
          [/[^\\"]+/, "string"],
          [/\\./, "string.escape"],
          [/"/, { token: "string.quote", bracket: "@close", next: "@pop" }],
        ],

        whitespace: [
          [/[ \t\r\n]+/, "white"],
          [/\/\*/, "comment", "@comment"],
          [/\/\/.*$/, "comment"],
        ],

        comment: [
          [/[^\/*]+/, "comment"],
          [/\*\//, "comment", "@pop"],
          [/[\/*]/, "comment"],
        ],
      },
    });

    // Custom dark theme for MiniLang
    monaco.editor.defineTheme("minilang-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "c678dd", fontStyle: "bold" },
        { token: "type", foreground: "e5c07b" },
        { token: "string", foreground: "98c379" },
        { token: "number", foreground: "d19a66" },
        { token: "number.float", foreground: "d19a66" },
        { token: "operator", foreground: "56b6c2" },
        { token: "comment", foreground: "5c6370", fontStyle: "italic" },
        { token: "identifier", foreground: "abb2bf" },
      ],
      colors: {
        "editor.background": "#090d16",
        "editor.lineHighlightBackground": "#1e293b33",
        "editorLineNumber.foreground": "#475569",
        "editorLineNumber.activeForeground": "#818cf8",
        "editorCursor.foreground": "#818cf8",
      },
    });

    monaco.editor.setTheme("minilang-dark");
  };

  // Sync compiler diagnostics / errors with Monaco markers
  useEffect(() => {
    if (!monacoRef.current || !editorRef.current || !artifacts) return;

    const monaco = monacoRef.current;
    const model = editorRef.current.getModel();
    if (!model) return;

    const markers: any[] = [];

    // Lexer errors
    for (const err of artifacts.lexerErrors) {
      markers.push({
        severity: monaco.MarkerSeverity.Error,
        message: err.message,
        startLineNumber: err.span.start.line,
        startColumn: err.span.start.column,
        endLineNumber: err.span.end.line,
        endColumn: err.span.end.column + 1,
      });
    }

    // Parser errors
    for (const err of artifacts.parserErrors) {
      markers.push({
        severity: monaco.MarkerSeverity.Error,
        message: err.message + (err.suggestion ? ` (${err.suggestion})` : ""),
        startLineNumber: err.span.start.line,
        startColumn: err.span.start.column,
        endLineNumber: err.span.end.line,
        endColumn: err.span.end.column + 1,
      });
    }

    // Semantic errors
    for (const err of artifacts.semanticErrors) {
      markers.push({
        severity: monaco.MarkerSeverity.Error,
        message: err.message,
        startLineNumber: err.span.start.line,
        startColumn: err.span.start.column,
        endLineNumber: err.span.end.line,
        endColumn: err.span.end.column + 1,
      });
    }

    // Semantic warnings
    for (const warn of artifacts.semanticWarnings) {
      markers.push({
        severity: monaco.MarkerSeverity.Warning,
        message: warn.message,
        startLineNumber: warn.span.start.line,
        startColumn: warn.span.start.column,
        endLineNumber: warn.span.end.line,
        endColumn: warn.span.end.column + 1,
      });
    }

    monaco.editor.setModelMarkers(model, "minilang", markers);
  }, [artifacts]);

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <Editor
        height="100%"
        language="minilang"
        value={code}
        onChange={(val) => setCode(val || "")}
        onMount={handleEditorDidMount}
        options={{
          fontSize: 13,
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontLigatures: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
          padding: { top: 12, bottom: 12 },
          lineNumbersMinChars: 3,
          cursorBlinking: "smooth",
          smoothScrolling: true,
        }}
      />
    </div>
  );
}
