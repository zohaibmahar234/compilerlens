export interface ExplanationResponse {
  explanation: string;
  suggestion?: string;
  source: "anthropic" | "fallback";
}

export function generateFallbackExplanation(
  errorMessage: string,
  sourceCode: string
): ExplanationResponse {
  const lower = errorMessage.toLowerCase();

  if (lower.includes("semicolon") || lower.includes("expected ';'")) {
    return {
      source: "fallback",
      explanation: `**Semicolon Syntax Requirement**:
In MiniLang (and most C-like languages), every variable declaration, assignment statement, return statement, and print statement must be terminated with a semicolon \`;\`.

**How to Fix**:
Check the line indicated by the compiler or the immediately preceding line, and ensure a semicolon \`;\` is present.`,
      suggestion: "Add a ';' at the end of the statement.",
    };
  }

  if (lower.includes("type mismatch") || lower.includes("cannot assign")) {
    return {
      source: "fallback",
      explanation: `**Static Type Enforcement**:
MiniLang is statically typed. Variables have fixed types (\`int\`, \`float\`, \`bool\`, \`string\`) declared ahead of time. You cannot assign a value of an incompatible type to a variable.

**Type Rules**:
- \`int\` only accepts integers.
- \`float\` accepts floating-point numbers and can widen from \`int\`.
- \`bool\` only accepts \`true\` or \`false\`.
- \`string\` only accepts quoted text \`"..."\`.`,
      suggestion: "Convert the value or change the variable's declared type.",
    };
  }

  if (lower.includes("undeclared") || lower.includes("use of undeclared")) {
    return {
      source: "fallback",
      explanation: `**Scope & Identifier Resolution**:
The identifier was referenced before being declared in the current or any enclosing lexical scope.

**How to Fix**:
1. Check for typos in the variable or function name.
2. Ensure you declared the variable with a type (e.g. \`int myVar = ...;\`) before using it.
3. If declared in an inner block \`{ ... }\`, it is not accessible outside that block.`,
      suggestion: "Declare the identifier with its type before reading or writing it.",
    };
  }

  if (lower.includes("must return a value") || lower.includes("missing_return")) {
    return {
      source: "fallback",
      explanation: `**Deterministic Return Paths**:
In MiniLang, non-void functions must guarantee that a value is returned along every possible execution path.

**How to Fix**:
If your function contains conditional branches (\`if / else\`), ensure that both branches return, or place a default \`return\` statement at the end of the function body.`,
      suggestion: "Add a default return statement at the end of the function body.",
    };
  }

  if (lower.includes("condition must evaluate to 'bool'")) {
    return {
      source: "fallback",
      explanation: `**Boolean Condition Requirement**:
Control flow structures (\`if\`, \`while\`, \`for\`) require their guard condition expression to evaluate to a \`bool\` (\`true\` or \`false\`). Unlike C or JavaScript, MiniLang does not implicitly cast numbers or strings to truthy/falsy booleans.`,
      suggestion: "Use comparison operators like 'x > 0' or 'x != 0' instead of raw numbers.",
    };
  }

  if (lower.includes("expects") && lower.includes("arguments")) {
    return {
      source: "fallback",
      explanation: `**Function Arity Mismatch**:
The number of arguments provided in the function call does not match the parameter list in the function declaration.`,
      suggestion: "Verify the function's parameter count in its definition.",
    };
  }

  return {
    source: "fallback",
    explanation: `**Compiler Diagnostic Insight**:
The compiler reported: \`${errorMessage}\`.

Review the syntax rules in **docs/GRAMMAR.md** to ensure your statements conform to MiniLang formal grammar specifications.`,
  };
}
