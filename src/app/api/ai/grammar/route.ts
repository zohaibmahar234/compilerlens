import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  try {
    const { grammarRule, query } = await req.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey || apiKey === "your_anthropic_api_key_here") {
      return NextResponse.json({
        analysis: `**Grammar Analysis (Offline Mode)**:
For rule: \`${grammarRule}\`
- Check for left recursion (e.g. A -> A alpha), which causes infinite recursion in recursive-descent parsers. Eliminate left recursion by introducing a primed non-terminal: A -> beta A', A' -> alpha A' | epsilon.
- Check for common prefixes among alternatives. Apply left factoring to ensure deterministic predictive parsing.
- Compute FIRST and FOLLOW sets to detect LL(1) table conflicts.`,
        source: "fallback",
      });
    }

    const anthropic = new Anthropic({ apiKey });

    const prompt = `Analyze the following context-free grammar rule or query:
Rule: ${grammarRule}
Question: ${query || "Check if this rule has left recursion, needs left factoring, or violates LL(1) conditions."}

Provide a concise, formal analysis suitable for a compiler design course.`;

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });

    const contentBlock = response.content[0];
    const analysis = contentBlock.type === "text" ? contentBlock.text : "";

    return NextResponse.json({ analysis, source: "anthropic" });
  } catch (err: any) {
    return NextResponse.json({
      analysis: "Grammar analysis unavailable offline.",
      source: "fallback",
    });
  }
}
