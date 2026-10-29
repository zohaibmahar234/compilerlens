import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { generateFallbackExplanation } from "@/lib/ai/fallback-explainer";

export async function POST(req: NextRequest) {
  try {
    const { sourceCode, errorMessage } = await req.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey || apiKey === "your_anthropic_api_key_here") {
      // Use intelligent offline fallback
      const fallback = generateFallbackExplanation(errorMessage || "", sourceCode || "");
      return NextResponse.json(fallback);
    }

    const anthropic = new Anthropic({ apiKey });

    const prompt = `You are an expert compiler engineering tutor. A student writing a program in a custom C-like language called MiniLang received the following compiler error:

Compiler Error:
${errorMessage}

Student's MiniLang Source Code:
\`\`\`c
${sourceCode}
\`\`\`

Explain why this compiler error occurred and provide a clear, concise tutorial explanation and a fix recommendation. Format your response in clean Markdown with bolding, bullet points, and code snippets where appropriate.`;

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });

    const contentBlock = response.content[0];
    const explanation =
      contentBlock.type === "text"
        ? contentBlock.text
        : "Explanation unavailable.";

    return NextResponse.json({
      explanation,
      source: "anthropic",
    });
  } catch (err: any) {
    const fallback = generateFallbackExplanation(
      "Compiler Error Encountered",
      ""
    );
    return NextResponse.json(fallback);
  }
}
