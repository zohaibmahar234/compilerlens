export enum TokenType {
  // End of file & Special
  EOF = "EOF",
  ILLEGAL = "ILLEGAL",
  COMMENT = "COMMENT",

  // Literals
  INT_LITERAL = "INT_LITERAL",
  FLOAT_LITERAL = "FLOAT_LITERAL",
  STRING_LITERAL = "STRING_LITERAL",
  IDENTIFIER = "IDENTIFIER",

  // Keywords
  FUNCTION = "FUNCTION",
  INT = "INT",
  FLOAT = "FLOAT",
  BOOL = "BOOL",
  STRING = "STRING",
  VOID = "VOID",
  IF = "IF",
  ELSE = "ELSE",
  WHILE = "WHILE",
  FOR = "FOR",
  RETURN = "RETURN",
  PRINT = "PRINT",
  TRUE = "TRUE",
  FALSE = "FALSE",

  // Operators
  PLUS = "PLUS",
  MINUS = "MINUS",
  STAR = "STAR",
  SLASH = "SLASH",
  PERCENT = "PERCENT",

  ASSIGN = "ASSIGN",
  EQ = "EQ",
  NOT_EQ = "NOT_EQ",
  LT = "LT",
  LTE = "LTE",
  GT = "GT",
  GTE = "GTE",

  AND = "AND",
  OR = "OR",
  NOT = "NOT",

  // Delimiters
  LPAREN = "LPAREN",
  RPAREN = "RPAREN",
  LBRACE = "LBRACE",
  RBRACE = "RBRACE",
  LBRACKET = "LBRACKET",
  RBRACKET = "RBRACKET",
  SEMICOLON = "SEMICOLON",
  COMMA = "COMMA",
}

export interface SourceLocation {
  line: number; // 1-indexed
  column: number; // 1-indexed
  offset: number; // 0-indexed byte/char offset
}

export interface Span {
  start: SourceLocation;
  end: SourceLocation;
}

export interface Token {
  type: TokenType;
  value: string;
  literal?: number | boolean | string;
  span: Span;
}

export const KEYWORDS: Record<string, TokenType> = {
  function: TokenType.FUNCTION,
  int: TokenType.INT,
  float: TokenType.FLOAT,
  bool: TokenType.BOOL,
  string: TokenType.STRING,
  void: TokenType.VOID,
  if: TokenType.IF,
  else: TokenType.ELSE,
  while: TokenType.WHILE,
  for: TokenType.FOR,
  return: TokenType.RETURN,
  print: TokenType.PRINT,
  true: TokenType.TRUE,
  false: TokenType.FALSE,
};

export function lookupIdentifier(ident: string): TokenType {
  return KEYWORDS[ident] ?? TokenType.IDENTIFIER;
}

export function isKeyword(type: TokenType): boolean {
  return [
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
    TokenType.TRUE,
    TokenType.FALSE,
  ].includes(type);
}

export function isTypeKeyword(type: TokenType): boolean {
  return [
    TokenType.INT,
    TokenType.FLOAT,
    TokenType.BOOL,
    TokenType.STRING,
    TokenType.VOID,
  ].includes(type);
}
