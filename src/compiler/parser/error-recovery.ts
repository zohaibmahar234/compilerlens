import { Token, TokenType, Span } from "../lexer/tokens";

export interface ParserError {
  message: string;
  span: Span;
  expected?: string[];
  found?: string;
  suggestion?: string;
}

export const SYNC_TOKENS = new Set<TokenType>([
  TokenType.SEMICOLON,
  TokenType.RBRACE,
  TokenType.FUNCTION,
  TokenType.IF,
  TokenType.WHILE,
  TokenType.FOR,
  TokenType.RETURN,
  TokenType.PRINT,
  TokenType.INT,
  TokenType.FLOAT,
  TokenType.BOOL,
  TokenType.STRING,
  TokenType.VOID,
]);

export function getExpectedSuggestion(expected: string, found: Token): string {
  if (expected === ";" && found.span.start.line > 1) {
    return "Check for a missing semicolon ';' at the end of the previous line.";
  }
  if (expected === ")" && found.type === TokenType.LBRACE) {
    return "Missing closing parenthesis ')' before the block '{'.";
  }
  if (expected === "}" && found.type === TokenType.EOF) {
    return "Unclosed block: missing closing brace '}'.";
  }
  return `Expected ${expected}, but found '${found.value}'.`;
}
