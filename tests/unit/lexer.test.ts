import { describe, it, expect } from "vitest";
import { Lexer } from "../../src/compiler/lexer/lexer";
import { TokenType } from "../../src/compiler/lexer/tokens";

describe("Lexer Unit Tests", () => {
  // Helper to extract token types
  const getTypes = (code: string, includeComments = false) => {
    const lexer = new Lexer(code);
    const { tokens } = lexer.tokenize(includeComments);
    return tokens.map((t) => t.type);
  };

  // 1-5: Number literals
  it("tokenizes single digit integer", () => {
    const lexer = new Lexer("5");
    const { tokens } = lexer.tokenize();
    expect(tokens[0].type).toBe(TokenType.INT_LITERAL);
    expect(tokens[0].literal).toBe(5);
  });

  it("tokenizes multi-digit integer", () => {
    const lexer = new Lexer("12345");
    const { tokens } = lexer.tokenize();
    expect(tokens[0].type).toBe(TokenType.INT_LITERAL);
    expect(tokens[0].literal).toBe(12345);
  });

  it("tokenizes zero integer", () => {
    const lexer = new Lexer("0");
    const { tokens } = lexer.tokenize();
    expect(tokens[0].type).toBe(TokenType.INT_LITERAL);
    expect(tokens[0].literal).toBe(0);
  });

  it("tokenizes simple float literal", () => {
    const lexer = new Lexer("3.1415");
    const { tokens } = lexer.tokenize();
    expect(tokens[0].type).toBe(TokenType.FLOAT_LITERAL);
    expect(tokens[0].literal).toBeCloseTo(3.1415);
  });

  it("tokenizes float literal with leading zero", () => {
    const lexer = new Lexer("0.007");
    const { tokens } = lexer.tokenize();
    expect(tokens[0].type).toBe(TokenType.FLOAT_LITERAL);
    expect(tokens[0].literal).toBeCloseTo(0.007);
  });

  // 6-10: String literals & escapes
  it("tokenizes empty string literal", () => {
    const lexer = new Lexer('""');
    const { tokens } = lexer.tokenize();
    expect(tokens[0].type).toBe(TokenType.STRING_LITERAL);
    expect(tokens[0].literal).toBe("");
  });

  it("tokenizes standard string literal", () => {
    const lexer = new Lexer('"Hello, CompilerLens!"');
    const { tokens } = lexer.tokenize();
    expect(tokens[0].type).toBe(TokenType.STRING_LITERAL);
    expect(tokens[0].literal).toBe("Hello, CompilerLens!");
  });

  it("handles string with escaped quotes", () => {
    const lexer = new Lexer('"quote \\" inside"');
    const { tokens } = lexer.tokenize();
    expect(tokens[0].type).toBe(TokenType.STRING_LITERAL);
    expect(tokens[0].literal).toBe('quote " inside');
  });

  it("handles string with newline and tab escapes", () => {
    const lexer = new Lexer('"line1\\n\\tline2"');
    const { tokens } = lexer.tokenize();
    expect(tokens[0].type).toBe(TokenType.STRING_LITERAL);
    expect(tokens[0].literal).toBe("line1\n\tline2");
  });

  it("reports error on unterminated string", () => {
    const lexer = new Lexer('"unterminated string');
    const { errors } = lexer.tokenize();
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain("Unterminated string");
  });

  // 11-14: Booleans
  it("tokenizes true keyword literal", () => {
    const lexer = new Lexer("true");
    const { tokens } = lexer.tokenize();
    expect(tokens[0].type).toBe(TokenType.TRUE);
    expect(tokens[0].literal).toBe(true);
  });

  it("tokenizes false keyword literal", () => {
    const lexer = new Lexer("false");
    const { tokens } = lexer.tokenize();
    expect(tokens[0].type).toBe(TokenType.FALSE);
    expect(tokens[0].literal).toBe(false);
  });

  // 13-20: Keywords
  it("tokenizes function keyword", () => {
    expect(getTypes("function")).toEqual([TokenType.FUNCTION, TokenType.EOF]);
  });

  it("tokenizes primitive type keywords", () => {
    expect(getTypes("int float bool string void")).toEqual([
      TokenType.INT,
      TokenType.FLOAT,
      TokenType.BOOL,
      TokenType.STRING,
      TokenType.VOID,
      TokenType.EOF,
    ]);
  });

  it("tokenizes control flow keywords", () => {
    expect(getTypes("if else while for return")).toEqual([
      TokenType.IF,
      TokenType.ELSE,
      TokenType.WHILE,
      TokenType.FOR,
      TokenType.RETURN,
      TokenType.EOF,
    ]);
  });

  it("tokenizes print keyword", () => {
    expect(getTypes("print")).toEqual([TokenType.PRINT, TokenType.EOF]);
  });

  // 21-25: Identifiers
  it("tokenizes standard identifier", () => {
    const lexer = new Lexer("totalSum");
    const { tokens } = lexer.tokenize();
    expect(tokens[0].type).toBe(TokenType.IDENTIFIER);
    expect(tokens[0].value).toBe("totalSum");
  });

  it("tokenizes identifier with underscore prefix and digits", () => {
    const lexer = new Lexer("_temp_var_2");
    const { tokens } = lexer.tokenize();
    expect(tokens[0].type).toBe(TokenType.IDENTIFIER);
    expect(tokens[0].value).toBe("_temp_var_2");
  });

  it("distinguishes keyword prefix from identifier", () => {
    const lexer = new Lexer("integer whileLoop returnVal");
    const { tokens } = lexer.tokenize();
    expect(tokens[0].type).toBe(TokenType.IDENTIFIER);
    expect(tokens[1].type).toBe(TokenType.IDENTIFIER);
    expect(tokens[2].type).toBe(TokenType.IDENTIFIER);
  });

  // 24-28: Arithmetic Operators
  it("tokenizes plus and minus", () => {
    expect(getTypes("+ -")).toEqual([TokenType.PLUS, TokenType.MINUS, TokenType.EOF]);
  });

  it("tokenizes star, slash, percent", () => {
    expect(getTypes("* / %")).toEqual([
      TokenType.STAR,
      TokenType.SLASH,
      TokenType.PERCENT,
      TokenType.EOF,
    ]);
  });

  // 29-33: Comparison Operators
  it("tokenizes equality and inequality", () => {
    expect(getTypes("== !=")).toEqual([TokenType.EQ, TokenType.NOT_EQ, TokenType.EOF]);
  });

  it("tokenizes less than and less than equal", () => {
    expect(getTypes("< <=")).toEqual([TokenType.LT, TokenType.LTE, TokenType.EOF]);
  });

  it("tokenizes greater than and greater than equal", () => {
    expect(getTypes("> >=")).toEqual([TokenType.GT, TokenType.GTE, TokenType.EOF]);
  });

  // 34-36: Logical & Assignment Operators
  it("tokenizes logical AND and OR", () => {
    expect(getTypes("&& ||")).toEqual([TokenType.AND, TokenType.OR, TokenType.EOF]);
  });

  it("tokenizes logical NOT", () => {
    expect(getTypes("!")).toEqual([TokenType.NOT, TokenType.EOF]);
  });

  it("tokenizes assignment operator", () => {
    expect(getTypes("=")).toEqual([TokenType.ASSIGN, TokenType.EOF]);
  });

  // 37-40: Delimiters
  it("tokenizes parentheses", () => {
    expect(getTypes("( )")).toEqual([TokenType.LPAREN, TokenType.RPAREN, TokenType.EOF]);
  });

  it("tokenizes braces and brackets", () => {
    expect(getTypes("{ } [ ]")).toEqual([
      TokenType.LBRACE,
      TokenType.RBRACE,
      TokenType.LBRACKET,
      TokenType.RBRACKET,
      TokenType.EOF,
    ]);
  });

  it("tokenizes semicolons and commas", () => {
    expect(getTypes("; ,")).toEqual([TokenType.SEMICOLON, TokenType.COMMA, TokenType.EOF]);
  });

  // 41-45: Comments & Error Recovery
  it("ignores single-line comments by default", () => {
    const lexer = new Lexer("int x = 10; // comment line\nint y = 20;");
    const { tokens } = lexer.tokenize();
    expect(tokens.map((t) => t.type)).toEqual([
      TokenType.INT,
      TokenType.IDENTIFIER,
      TokenType.ASSIGN,
      TokenType.INT_LITERAL,
      TokenType.SEMICOLON,
      TokenType.INT,
      TokenType.IDENTIFIER,
      TokenType.ASSIGN,
      TokenType.INT_LITERAL,
      TokenType.SEMICOLON,
      TokenType.EOF,
    ]);
  });

  it("preserves comments when includeComments is true", () => {
    const lexer = new Lexer("// start\nx = 1;");
    const { tokens, comments } = lexer.tokenize(true);
    expect(comments.length).toBe(1);
    expect(comments[0].value).toBe("// start");
    expect(tokens[0].type).toBe(TokenType.COMMENT);
  });

  it("handles multi-line comments", () => {
    const lexer = new Lexer("/* multi\nline\ncomment */ a = b;");
    const { tokens } = lexer.tokenize();
    expect(tokens.map((t) => t.type)).toEqual([
      TokenType.IDENTIFIER,
      TokenType.ASSIGN,
      TokenType.IDENTIFIER,
      TokenType.SEMICOLON,
      TokenType.EOF,
    ]);
  });

  it("reports error on unterminated multi-line comment", () => {
    const lexer = new Lexer("/* unterminated");
    const { errors } = lexer.tokenize();
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain("Unterminated multi-line comment");
  });

  it("reports error for standalone '&'", () => {
    const lexer = new Lexer("&");
    const { errors, tokens } = lexer.tokenize();
    expect(errors.length).toBe(1);
    expect(errors[0].message).toContain("Did you mean '&&'?");
    expect(tokens[0].type).toBe(TokenType.ILLEGAL);
  });

  it("reports error for standalone '|'", () => {
    const lexer = new Lexer("|");
    const { errors, tokens } = lexer.tokenize();
    expect(errors.length).toBe(1);
    expect(errors[0].message).toContain("Did you mean '||'?");
    expect(tokens[0].type).toBe(TokenType.ILLEGAL);
  });

  it("tracks accurate line and column spans", () => {
    const code = "int a = 10;\nfloat b = 3.14;";
    const lexer = new Lexer(code);
    const { tokens } = lexer.tokenize();

    // First line
    expect(tokens[0].span.start.line).toBe(1);
    expect(tokens[0].span.start.column).toBe(1);

    // Second line 'float'
    const floatTok = tokens[5];
    expect(floatTok.type).toBe(TokenType.FLOAT);
    expect(floatTok.span.start.line).toBe(2);
    expect(floatTok.span.start.column).toBe(1);
  });

  it("tokenizes a complete MiniLang program without errors", () => {
    const code = `
      function int factorial(int n) {
        if (n <= 1) {
          return 1;
        }
        return n * factorial(n - 1);
      }

      int result = factorial(5);
      print("Factorial:", result);
    `;
    const lexer = new Lexer(code);
    const { tokens, errors } = lexer.tokenize();
    expect(errors.length).toBe(0);
    expect(tokens.length).toBeGreaterThan(25);
  });
});
