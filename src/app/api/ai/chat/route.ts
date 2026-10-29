import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  try {
    const { message, history, sourceCode } = await req.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey || apiKey === "your_anthropic_api_key_here") {
      // Offline fallback tutor
      const reply = `**AI Compiler Tutor (Offline Mode)**:
You asked: "${message}".

CompilerLens visualizes every transformation phase:
1. **Lexer**: Scans characters into Tokens with line/column coordinates.
2. **Parser**: Builds an Abstract Syntax Tree (AST) using recursive-descent parsing.
3. **Semantic Analyzer**: Validates types, checks scopes, and tracks symbol references.
4. **TAC Generator**: Linearizes expressions into Three-Address Code quadruples and forms Basic Blocks.
5. **Optimizer**: Applies constant folding, CSE, dead-code elimination, and loop-invariant hoisting.
6. **Bytecode VM**: Emits stack machine instructions and executes them with a step-by-step operand stack.

To ask questions directly with Claude 3.5 Sonnet, add your \`ANTHROPIC_API_KEY\` to \`.env.local\`.`;

      return NextResponse.json({ reply, source: "fallback" });
    }

    const anthropic = new Anthropic({ apiKey });

    const systemPrompt = `You are an AI Compiler Design Tutor inside CompilerLens, an interactive web platform for learning compiler engineering through a custom C-like language called MiniLang.
Help the student understand parsing algorithms, ASTs, symbol tables, Three-Address Code, basic blocks, dominator trees, compiler optimizations, and stack virtual machines.
Keep answers informative, encouraging, clear, and well-structured with Markdown formatting.
Current MiniLang Source Code in editor:
\`\`\`c
${sourceCode || "(empty)"}
\`\`\``;

    const messages = (history || []).map((m: any) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.content,
    }));
    messages.push({ role: "user", content: message });

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 800,
      system: systemPrompt,
      messages: messages as any,
    });

    const contentBlock = response.content[0];
    const reply = contentBlock.type === "text" ? contentBlock.text : "";

    return NextResponse.json({ reply, source: "anthropic" });
  } catch (err: any) {
    return NextResponse.json({
      reply: "Compiler Tutor is currently in offline mode. Please check your network or API key configuration.",
      source: "fallback",
    });
  }
}
