import {
  TokenType,
  Token,
  Span,
  SourceLocation,
  lookupIdentifier,
} from "./tokens";

export interface LexerError {
  message: string;
  span: Span;
  code?: string;
}

export interface LexerResult {
  tokens: Token[];
  errors: LexerError[];
  comments: Token[];
}

export class Lexer {
  private readonly source: string;
  private readonly length: number;
  private cursor = 0;
  private line = 1;
  private column = 1;

  private tokens: Token[] = [];
  private comments: Token[] = [];
  private errors: LexerError[] = [];

  constructor(source: string) {
    this.source = source;
    this.length = source.length;
  }

  public tokenize(includeComments = false): LexerResult {
    this.tokens = [];
    this.comments = [];
    this.errors = [];
    this.cursor = 0;
    this.line = 1;
    this.column = 1;

    while (!this.isAtEnd()) {
      const startLoc = this.getCurrentLocation();
      const ch = this.peek();

      // Whitespace
      if (this.isWhitespace(ch)) {
        this.advance();
        continue;
      }

      // Single-line comment or division
      if (ch === "/") {
        if (this.peekNext() === "/") {
          this.scanSingleLineComment(startLoc);
          continue;
        } else if (this.peekNext() === "*") {
          this.scanMultiLineComment(startLoc);
          continue;
        } else {
          this.advance();
          this.addToken(TokenType.SLASH, "/", startLoc);
          continue;
        }
      }

      // Numbers (int or float)
      if (this.isDigit(ch)) {
        this.scanNumber(startLoc);
        continue;
      }

      // Strings
      if (ch === '"') {
        this.scanString(startLoc);
        continue;
      }

      // Identifiers and Keywords
      if (this.isAlpha(ch) || ch === "_") {
        this.scanIdentifier(startLoc);
        continue;
      }

      // Operators and Delimiters
      this.advance();
      switch (ch) {
        case "+":
          this.addToken(TokenType.PLUS, "+", startLoc);
          break;
        case "-":
          this.addToken(TokenType.MINUS, "-", startLoc);
          break;
        case "*":
          this.addToken(TokenType.STAR, "*", startLoc);
          break;
        case "%":
          this.addToken(TokenType.PERCENT, "%", startLoc);
          break;
        case "(":
          this.addToken(TokenType.LPAREN, "(", startLoc);
          break;
        case ")":
          this.addToken(TokenType.RPAREN, ")", startLoc);
          break;
        case "{":
          this.addToken(TokenType.LBRACE, "{", startLoc);
          break;
        case "}":
          this.addToken(TokenType.RBRACE, "}", startLoc);
          break;
        case "[":
          this.addToken(TokenType.LBRACKET, "[", startLoc);
          break;
        case "]":
          this.addToken(TokenType.RBRACKET, "]", startLoc);
          break;
        case ";":
          this.addToken(TokenType.SEMICOLON, ";", startLoc);
          break;
        case ",":
          this.addToken(TokenType.COMMA, ",", startLoc);
          break;

        case "=":
          if (this.match("=")) {
            this.addToken(TokenType.EQ, "==", startLoc);
          } else {
            this.addToken(TokenType.ASSIGN, "=", startLoc);
          }
          break;

        case "!":
          if (this.match("=")) {
            this.addToken(TokenType.NOT_EQ, "!=", startLoc);
          } else {
            this.addToken(TokenType.NOT, "!", startLoc);
          }
          break;

        case "<":
          if (this.match("=")) {
            this.addToken(TokenType.LTE, "<=", startLoc);
          } else {
            this.addToken(TokenType.LT, "<", startLoc);
          }
          break;

        case ">":
          if (this.match("=")) {
            this.addToken(TokenType.GTE, ">=", startLoc);
          } else {
            this.addToken(TokenType.GT, ">", startLoc);
          }
          break;

        case "&":
          if (this.match("&")) {
            this.addToken(TokenType.AND, "&&", startLoc);
          } else {
            this.reportError(`Unexpected character '&'. Did you mean '&&'?`, {
              start: startLoc,
              end: this.getCurrentLocation(),
            });
            this.addToken(TokenType.ILLEGAL, "&", startLoc);
          }
          break;

        case "|":
          if (this.match("|")) {
            this.addToken(TokenType.OR, "||", startLoc);
          } else {
            this.reportError(`Unexpected character '|'. Did you mean '||'?`, {
              start: startLoc,
              end: this.getCurrentLocation(),
            });
            this.addToken(TokenType.ILLEGAL, "|", startLoc);
          }
          break;

        default:
          this.reportError(`Unrecognized character: '${ch}'`, {
            start: startLoc,
            end: this.getCurrentLocation(),
          });
          this.addToken(TokenType.ILLEGAL, ch, startLoc);
          break;
      }
    }

    const eofLoc = this.getCurrentLocation();
    this.addToken(TokenType.EOF, "", eofLoc);

    const resultTokens = includeComments
      ? [...this.tokens, ...this.comments].sort(
          (a, b) => a.span.start.offset - b.span.start.offset
        )
      : this.tokens;

    return {
      tokens: resultTokens,
      errors: this.errors,
      comments: this.comments,
    };
  }

  private scanSingleLineComment(startLoc: SourceLocation): void {
    // Consume '//'
    this.advance();
    this.advance();
    let text = "//";
    while (!this.isAtEnd() && this.peek() !== "\n") {
      text += this.advance();
    }
    const endLoc = this.getCurrentLocation();
    this.comments.push({
      type: TokenType.COMMENT,
      value: text,
      span: { start: startLoc, end: endLoc },
    });
  }

  private scanMultiLineComment(startLoc: SourceLocation): void {
    // Consume '/*'
    this.advance();
    this.advance();
    let text = "/*";
    let isTerminated = false;

    while (!this.isAtEnd()) {
      if (this.peek() === "*" && this.peekNext() === "/") {
        text += this.advance(); // *
        text += this.advance(); // /
        isTerminated = true;
        break;
      }
      text += this.advance();
    }

    const endLoc = this.getCurrentLocation();
    if (!isTerminated) {
      this.reportError("Unterminated multi-line comment", {
        start: startLoc,
        end: endLoc,
      });
    }

    this.comments.push({
      type: TokenType.COMMENT,
      value: text,
      span: { start: startLoc, end: endLoc },
    });
  }

  private scanNumber(startLoc: SourceLocation): void {
    let raw = "";
    while (this.isDigit(this.peek())) {
      raw += this.advance();
    }

    let isFloat = false;
    if (this.peek() === "." && this.isDigit(this.peekNext())) {
      isFloat = true;
      raw += this.advance(); // consume '.'
      while (this.isDigit(this.peek())) {
        raw += this.advance();
      }
    }

    // Check for erroneous consecutive decimal point like 1.2.3
    if (this.peek() === "." && this.isDigit(this.peekNext())) {
      raw += this.advance();
      while (this.isDigit(this.peek())) {
        raw += this.advance();
      }
      this.reportError(`Invalid number literal format: '${raw}'`, {
        start: startLoc,
        end: this.getCurrentLocation(),
      });
      this.addToken(TokenType.ILLEGAL, raw, startLoc);
      return;
    }

    const endLoc = this.getCurrentLocation();
    if (isFloat) {
      this.tokens.push({
        type: TokenType.FLOAT_LITERAL,
        value: raw,
        literal: parseFloat(raw),
        span: { start: startLoc, end: endLoc },
      });
    } else {
      this.tokens.push({
        type: TokenType.INT_LITERAL,
        value: raw,
        literal: parseInt(raw, 10),
        span: { start: startLoc, end: endLoc },
      });
    }
  }

  private scanString(startLoc: SourceLocation): void {
    this.advance(); // consume opening quote
    let value = "";
    let isTerminated = false;

    while (!this.isAtEnd()) {
      const ch = this.peek();

      if (ch === '"') {
        this.advance(); // consume closing quote
        isTerminated = true;
        break;
      }

      if (ch === "\n") {
        this.reportError("Unterminated string literal: newlines are not permitted inside strings", {
          start: startLoc,
          end: this.getCurrentLocation(),
        });
        break;
      }

      if (ch === "\\") {
        this.advance(); // consume backslash
        if (this.isAtEnd()) break;
        const escapeChar = this.advance();
        switch (escapeChar) {
          case '"':
            value += '"';
            break;
          case "\\":
            value += "\\";
            break;
          case "n":
            value += "\n";
            break;
          case "t":
            value += "\t";
            break;
          case "r":
            value += "\r";
            break;
          default:
            this.reportError(`Unknown escape sequence '\\${escapeChar}'`, {
              start: startLoc,
              end: this.getCurrentLocation(),
            });
            value += escapeChar;
            break;
        }
      } else {
        value += this.advance();
      }
    }

    const endLoc = this.getCurrentLocation();
    if (!isTerminated) {
      this.reportError("Unterminated string literal", {
        start: startLoc,
        end: endLoc,
      });
      this.addToken(TokenType.ILLEGAL, `"${value}`, startLoc);
      return;
    }

    this.tokens.push({
      type: TokenType.STRING_LITERAL,
      value: `"${value}"`,
      literal: value,
      span: { start: startLoc, end: endLoc },
    });
  }

  private scanIdentifier(startLoc: SourceLocation): void {
    let name = "";
    while (this.isAlphaNumeric(this.peek()) || this.peek() === "_") {
      name += this.advance();
    }

    const type = lookupIdentifier(name);
    const endLoc = this.getCurrentLocation();

    let literal: boolean | undefined = undefined;
    if (type === TokenType.TRUE) literal = true;
    if (type === TokenType.FALSE) literal = false;

    this.tokens.push({
      type,
      value: name,
      literal,
      span: { start: startLoc, end: endLoc },
    });
  }

  private addToken(type: TokenType, value: string, startLoc: SourceLocation): void {
    const endLoc = this.getCurrentLocation();
    this.tokens.push({
      type,
      value,
      span: { start: startLoc, end: endLoc },
    });
  }

  private reportError(message: string, span: Span): void {
    this.errors.push({ message, span });
  }

  private advance(): string {
    const ch = this.source[this.cursor];
    this.cursor++;
    if (ch === "\n") {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return ch;
  }

  private match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.source[this.cursor] !== expected) return false;
    this.advance();
    return true;
  }

  private peek(): string {
    if (this.isAtEnd()) return "\0";
    return this.source[this.cursor];
  }

  private peekNext(): string {
    if (this.cursor + 1 >= this.length) return "\0";
    return this.source[this.cursor + 1];
  }

  private isAtEnd(): boolean {
    return this.cursor >= this.length;
  }

  private getCurrentLocation(): SourceLocation {
    return {
      line: this.line,
      column: this.column,
      offset: this.cursor,
    };
  }

  private isDigit(ch: string): boolean {
    return ch >= "0" && ch <= "9";
  }

  private isAlpha(ch: string): boolean {
    return (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z");
  }

  private isAlphaNumeric(ch: string): boolean {
    return this.isAlpha(ch) || this.isDigit(ch);
  }

  private isWhitespace(ch: string): boolean {
    return ch === " " || ch === "\t" || ch === "\r" || ch === "\n";
  }
}
