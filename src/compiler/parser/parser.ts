import {
  TokenType,
  Token,
  Span,
  isTypeKeyword,
} from "../lexer/tokens";
import {
  Program,
  Declaration,
  Statement,
  FunctionDeclaration,
  VariableDeclaration,
  Parameter,
  BlockStatement,
  AssignmentStatement,
  IfStatement,
  WhileStatement,
  ForStatement,
  ReturnStatement,
  PrintStatement,
  ExpressionStatement,
  Expression,
  BinaryExpression,
  UnaryExpression,
  CallExpression,
  LiteralExpression,
  IdentifierExpression,
  GroupingExpression,
  TypeNode,
  MiniLangType,
  ASTNodeKind,
  BinaryOperator,
  UnaryOperator,
} from "../ast/nodes";
import { ParserError, SYNC_TOKENS, getExpectedSuggestion } from "./error-recovery";

export interface ParserResult {
  ast: Program;
  errors: ParserError[];
}

export class Parser {
  private readonly tokens: Token[];
  private cursor = 0;
  private readonly errors: ParserError[] = [];
  private nodeIdCounter = 0;

  constructor(tokens: Token[]) {
    // Filter out comments from the parser token stream
    this.tokens = tokens.filter((t) => t.type !== TokenType.COMMENT);
  }

  public parse(): ParserResult {
    this.cursor = 0;
    this.errors.length = 0;
    this.nodeIdCounter = 0;

    const startSpan: Span = this.currentToken().span;
    const declarations: Declaration[] = [];

    while (!this.isAtEnd()) {
      try {
        const decl = this.parseDeclaration();
        if (decl) {
          declarations.push(decl);
        }
      } catch (err) {
        this.synchronize();
      }
    }

    const endSpan: Span = this.peekPrevious().span;

    const program: Program = {
      id: this.nextId(),
      kind: ASTNodeKind.Program,
      span: {
        start: startSpan.start,
        end: endSpan.end,
      },
      declarations,
    };

    return {
      ast: program,
      errors: this.errors,
    };
  }

  // -------------------------------------------------------------
  // Declarations & Statements
  // -------------------------------------------------------------

  private parseDeclaration(): Declaration {
    if (this.check(TokenType.FUNCTION)) {
      return this.parseFunctionDeclaration();
    }
    if (this.isType(this.currentToken().type)) {
      return this.parseVariableDeclaration();
    }
    return this.parseStatement();
  }

  private parseFunctionDeclaration(): FunctionDeclaration {
    const startTok = this.consume(TokenType.FUNCTION, "Expected 'function'");
    const returnType = this.parseTypeNode();
    const nameTok = this.consume(TokenType.IDENTIFIER, "Expected function name");
    this.consume(TokenType.LPAREN, "Expected '(' after function name");

    const parameters: Parameter[] = [];
    if (!this.check(TokenType.RPAREN)) {
      do {
        const paramType = this.parseTypeNode();
        const paramName = this.consume(
          TokenType.IDENTIFIER,
          "Expected parameter name"
        );
        parameters.push({
          id: this.nextId(),
          kind: ASTNodeKind.Parameter,
          span: {
            start: paramType.span.start,
            end: paramName.span.end,
          },
          typeNode: paramType,
          name: paramName.value,
        });
      } while (this.match(TokenType.COMMA));
    }

    this.consume(TokenType.RPAREN, "Expected ')' after parameter list");
    const body = this.parseBlockStatement();

    return {
      id: this.nextId(),
      kind: ASTNodeKind.FunctionDeclaration,
      span: {
        start: startTok.span.start,
        end: body.span.end,
      },
      returnType,
      name: nameTok.value,
      parameters,
      body,
    };
  }

  private parseVariableDeclaration(): VariableDeclaration {
    const { decl, endSpan } = this.parseVariableDeclarationBody();
    const semiTok = this.consume(
      TokenType.SEMICOLON,
      "Expected ';' after variable declaration"
    );
    return {
      ...decl,
      span: { start: decl.span.start, end: semiTok.span.end },
    };
  }

  /**
   * Parses the type + name + optional initializer of a variable declaration
   * WITHOUT consuming the trailing semicolon. Used by parseForStatement so
   * the for-loop semicolons are not double-consumed.
   */
  private parseVariableDeclarationBody(): {
    decl: VariableDeclaration;
    endSpan: import("../lexer/tokens").Span;
  } {
    const typeNode = this.parseTypeNode();
    const nameTok = this.consume(
      TokenType.IDENTIFIER,
      "Expected variable name after type"
    );

    let initializer: Expression | undefined = undefined;
    if (this.match(TokenType.ASSIGN)) {
      initializer = this.parseExpression();
    }

    const endSpan = initializer ? initializer.span : nameTok.span;

    const decl: VariableDeclaration = {
      id: this.nextId(),
      kind: ASTNodeKind.VariableDeclaration,
      span: {
        start: typeNode.span.start,
        end: endSpan.end,
      },
      typeNode,
      name: nameTok.value,
      initializer,
    };
    return { decl, endSpan };
  }

  private parseStatement(): Statement {
    if (this.check(TokenType.LBRACE)) {
      return this.parseBlockStatement();
    }
    if (this.check(TokenType.IF)) {
      return this.parseIfStatement();
    }
    if (this.check(TokenType.WHILE)) {
      return this.parseWhileStatement();
    }
    if (this.check(TokenType.FOR)) {
      return this.parseForStatement();
    }
    if (this.check(TokenType.RETURN)) {
      return this.parseReturnStatement();
    }
    if (this.check(TokenType.PRINT)) {
      return this.parsePrintStatement();
    }
    if (this.isType(this.currentToken().type)) {
      return this.parseVariableDeclaration();
    }

    // Assignment or Expression Statement
    if (
      this.check(TokenType.IDENTIFIER) &&
      this.peekNextToken().type === TokenType.ASSIGN
    ) {
      return this.parseAssignmentStatement();
    }

    return this.parseExpressionStatement();
  }

  private parseBlockStatement(): BlockStatement {
    const startTok = this.consume(TokenType.LBRACE, "Expected '{'");
    const statements: Statement[] = [];

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      try {
        statements.push(this.parseStatement());
      } catch (err) {
        this.synchronize();
      }
    }

    const endTok = this.consume(TokenType.RBRACE, "Expected '}'");

    return {
      id: this.nextId(),
      kind: ASTNodeKind.BlockStatement,
      span: {
        start: startTok.span.start,
        end: endTok.span.end,
      },
      statements,
    };
  }

  private parseAssignmentStatement(): AssignmentStatement {
    const identTok = this.consume(TokenType.IDENTIFIER, "Expected identifier");
    this.consume(TokenType.ASSIGN, "Expected '=' in assignment");
    const value = this.parseExpression();
    const semiTok = this.consume(
      TokenType.SEMICOLON,
      "Expected ';' after assignment"
    );

    return {
      id: this.nextId(),
      kind: ASTNodeKind.AssignmentStatement,
      span: {
        start: identTok.span.start,
        end: semiTok.span.end,
      },
      target: identTok.value,
      value,
    };
  }

  private parseIfStatement(): IfStatement {
    const ifTok = this.consume(TokenType.IF, "Expected 'if'");
    this.consume(TokenType.LPAREN, "Expected '(' after 'if'");
    const condition = this.parseExpression();
    this.consume(TokenType.RPAREN, "Expected ')' after if condition");
    const consequent = this.parseBlockStatement();

    let alternate: BlockStatement | undefined = undefined;
    if (this.match(TokenType.ELSE)) {
      if (this.check(TokenType.IF)) {
        // Wrap 'else if' in a synthetic block
        const elseIfStmt = this.parseIfStatement();
        alternate = {
          id: this.nextId(),
          kind: ASTNodeKind.BlockStatement,
          span: elseIfStmt.span,
          statements: [elseIfStmt],
        };
      } else {
        alternate = this.parseBlockStatement();
      }
    }

    return {
      id: this.nextId(),
      kind: ASTNodeKind.IfStatement,
      span: {
        start: ifTok.span.start,
        end: alternate ? alternate.span.end : consequent.span.end,
      },
      condition,
      consequent,
      alternate,
    };
  }

  private parseWhileStatement(): WhileStatement {
    const whileTok = this.consume(TokenType.WHILE, "Expected 'while'");
    this.consume(TokenType.LPAREN, "Expected '(' after 'while'");
    const condition = this.parseExpression();
    this.consume(TokenType.RPAREN, "Expected ')' after condition");
    const body = this.parseBlockStatement();

    return {
      id: this.nextId(),
      kind: ASTNodeKind.WhileStatement,
      span: {
        start: whileTok.span.start,
        end: body.span.end,
      },
      condition,
      body,
    };
  }

  private parseForStatement(): ForStatement {
    const forTok = this.consume(TokenType.FOR, "Expected 'for'");
    this.consume(TokenType.LPAREN, "Expected '(' after 'for'");

    let initializer: VariableDeclaration | AssignmentStatement | undefined =
      undefined;
    if (this.match(TokenType.SEMICOLON)) {
      // Empty initializer
    } else if (this.isType(this.currentToken().type)) {
      // Parse type+name+init WITHOUT the trailing ';' — the for-header uses
      // its own ';' as a clause separator.
      const { decl } = this.parseVariableDeclarationBody();
      this.consume(TokenType.SEMICOLON, "Expected ';' after for-loop variable declaration");
      initializer = decl;
    } else if (
      this.check(TokenType.IDENTIFIER) &&
      this.peekNextToken().type === TokenType.ASSIGN
    ) {
      initializer = this.parseAssignmentStatement();
    } else {
      this.reportError("Invalid for-loop initializer", this.currentToken().span);
      this.synchronize();
    }

    let condition: Expression | undefined = undefined;
    if (!this.check(TokenType.SEMICOLON)) {
      condition = this.parseExpression();
    }
    this.consume(TokenType.SEMICOLON, "Expected ';' after for condition");

    let update: AssignmentStatement | Expression | undefined = undefined;
    if (!this.check(TokenType.RPAREN)) {
      // Support assignment-style update (e.g. i = i + 1) without semicolons
      if (
        this.check(TokenType.IDENTIFIER) &&
        this.peekNextToken().type === TokenType.ASSIGN
      ) {
        const identTok = this.advance(); // consume identifier
        this.advance();                  // consume '='
        const val = this.parseExpression();
        update = {
          id: this.nextId(),
          kind: ASTNodeKind.AssignmentStatement,
          span: { start: identTok.span.start, end: val.span.end },
          target: identTok.value,
          value: val,
        } as AssignmentStatement;
      } else {
        update = this.parseExpression();
      }
    }
    this.consume(TokenType.RPAREN, "Expected ')' after for clauses");

    const body = this.parseBlockStatement();

    return {
      id: this.nextId(),
      kind: ASTNodeKind.ForStatement,
      span: {
        start: forTok.span.start,
        end: body.span.end,
      },
      initializer,
      condition,
      update,
      body,
    };
  }

  private parseReturnStatement(): ReturnStatement {
    const returnTok = this.consume(TokenType.RETURN, "Expected 'return'");
    let argument: Expression | undefined = undefined;

    if (!this.check(TokenType.SEMICOLON)) {
      argument = this.parseExpression();
    }

    const semiTok = this.consume(
      TokenType.SEMICOLON,
      "Expected ';' after return statement"
    );

    return {
      id: this.nextId(),
      kind: ASTNodeKind.ReturnStatement,
      span: {
        start: returnTok.span.start,
        end: semiTok.span.end,
      },
      argument,
    };
  }

  private parsePrintStatement(): PrintStatement {
    const printTok = this.consume(TokenType.PRINT, "Expected 'print'");
    this.consume(TokenType.LPAREN, "Expected '(' after 'print'");

    const args: Expression[] = [];
    if (!this.check(TokenType.RPAREN)) {
      do {
        args.push(this.parseExpression());
      } while (this.match(TokenType.COMMA));
    }

    this.consume(TokenType.RPAREN, "Expected ')' after print arguments");
    const semiTok = this.consume(
      TokenType.SEMICOLON,
      "Expected ';' after print statement"
    );

    return {
      id: this.nextId(),
      kind: ASTNodeKind.PrintStatement,
      span: {
        start: printTok.span.start,
        end: semiTok.span.end,
      },
      arguments: args,
    };
  }

  private parseExpressionStatement(): ExpressionStatement {
    const expr = this.parseExpression();
    const semiTok = this.consume(
      TokenType.SEMICOLON,
      "Expected ';' after expression"
    );

    return {
      id: this.nextId(),
      kind: ASTNodeKind.ExpressionStatement,
      span: {
        start: expr.span.start,
        end: semiTok.span.end,
      },
      expression: expr,
    };
  }

  // -------------------------------------------------------------
  // Expressions (Pratt Precedence Climbing)
  // -------------------------------------------------------------

  public parseExpression(): Expression {
    return this.parseLogicalOr();
  }

  private parseLogicalOr(): Expression {
    let expr = this.parseLogicalAnd();

    while (this.match(TokenType.OR)) {
      const op = "||";
      const right = this.parseLogicalAnd();
      expr = {
        id: this.nextId(),
        kind: ASTNodeKind.BinaryExpression,
        span: { start: expr.span.start, end: right.span.end },
        left: expr,
        operator: op,
        right,
      };
    }

    return expr;
  }

  private parseLogicalAnd(): Expression {
    let expr = this.parseEquality();

    while (this.match(TokenType.AND)) {
      const op = "&&";
      const right = this.parseEquality();
      expr = {
        id: this.nextId(),
        kind: ASTNodeKind.BinaryExpression,
        span: { start: expr.span.start, end: right.span.end },
        left: expr,
        operator: op,
        right,
      };
    }

    return expr;
  }

  private parseEquality(): Expression {
    let expr = this.parseComparison();

    while (this.match(TokenType.EQ, TokenType.NOT_EQ)) {
      const opTok = this.peekPrevious();
      const op = (opTok.type === TokenType.EQ ? "==" : "!=") as BinaryOperator;
      const right = this.parseComparison();
      expr = {
        id: this.nextId(),
        kind: ASTNodeKind.BinaryExpression,
        span: { start: expr.span.start, end: right.span.end },
        left: expr,
        operator: op,
        right,
      };
    }

    return expr;
  }

  private parseComparison(): Expression {
    let expr = this.parseAddition();

    while (
      this.match(TokenType.LT, TokenType.LTE, TokenType.GT, TokenType.GTE)
    ) {
      const opTok = this.peekPrevious();
      const op = opTok.value as BinaryOperator;
      const right = this.parseAddition();
      expr = {
        id: this.nextId(),
        kind: ASTNodeKind.BinaryExpression,
        span: { start: expr.span.start, end: right.span.end },
        left: expr,
        operator: op,
        right,
      };
    }

    return expr;
  }

  private parseAddition(): Expression {
    let expr = this.parseMultiplication();

    while (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const opTok = this.peekPrevious();
      const op = (opTok.type === TokenType.PLUS ? "+" : "-") as BinaryOperator;
      const right = this.parseMultiplication();
      expr = {
        id: this.nextId(),
        kind: ASTNodeKind.BinaryExpression,
        span: { start: expr.span.start, end: right.span.end },
        left: expr,
        operator: op,
        right,
      };
    }

    return expr;
  }

  private parseMultiplication(): Expression {
    let expr = this.parseUnary();

    while (this.match(TokenType.STAR, TokenType.SLASH, TokenType.PERCENT)) {
      const opTok = this.peekPrevious();
      const op = opTok.value as BinaryOperator;
      const right = this.parseUnary();
      expr = {
        id: this.nextId(),
        kind: ASTNodeKind.BinaryExpression,
        span: { start: expr.span.start, end: right.span.end },
        left: expr,
        operator: op,
        right,
      };
    }

    return expr;
  }

  private parseUnary(): Expression {
    if (this.match(TokenType.NOT, TokenType.MINUS)) {
      const opTok = this.peekPrevious();
      const op = (opTok.type === TokenType.NOT ? "!" : "-") as UnaryOperator;
      const operand = this.parseUnary();
      return {
        id: this.nextId(),
        kind: ASTNodeKind.UnaryExpression,
        span: { start: opTok.span.start, end: operand.span.end },
        operator: op,
        operand,
      };
    }

    return this.parsePrimary();
  }

  private parsePrimary(): Expression {
    const token = this.currentToken();

    // Integer literal
    if (this.match(TokenType.INT_LITERAL)) {
      return {
        id: this.nextId(),
        kind: ASTNodeKind.LiteralExpression,
        span: token.span,
        literalType: "int",
        value: token.literal as number,
        raw: token.value,
      };
    }

    // Float literal
    if (this.match(TokenType.FLOAT_LITERAL)) {
      return {
        id: this.nextId(),
        kind: ASTNodeKind.LiteralExpression,
        span: token.span,
        literalType: "float",
        value: token.literal as number,
        raw: token.value,
      };
    }

    // Boolean literal
    if (this.match(TokenType.TRUE, TokenType.FALSE)) {
      return {
        id: this.nextId(),
        kind: ASTNodeKind.LiteralExpression,
        span: token.span,
        literalType: "bool",
        value: token.type === TokenType.TRUE,
        raw: token.value,
      };
    }

    // String literal
    if (this.match(TokenType.STRING_LITERAL)) {
      return {
        id: this.nextId(),
        kind: ASTNodeKind.LiteralExpression,
        span: token.span,
        literalType: "string",
        value: token.literal as string,
        raw: token.value,
      };
    }

    // Function Call or Variable Identifier
    if (this.match(TokenType.IDENTIFIER)) {
      if (this.match(TokenType.LPAREN)) {
        // Function call
        const args: Expression[] = [];
        if (!this.check(TokenType.RPAREN)) {
          do {
            args.push(this.parseExpression());
          } while (this.match(TokenType.COMMA));
        }
        const closeParen = this.consume(
          TokenType.RPAREN,
          "Expected ')' after function arguments"
        );
        return {
          id: this.nextId(),
          kind: ASTNodeKind.CallExpression,
          span: { start: token.span.start, end: closeParen.span.end },
          callee: token.value,
          arguments: args,
        };
      }

      return {
        id: this.nextId(),
        kind: ASTNodeKind.IdentifierExpression,
        span: token.span,
        name: token.value,
      };
    }

    // Grouping expression: ( expr )
    if (this.match(TokenType.LPAREN)) {
      const expr = this.parseExpression();
      const closeParen = this.consume(
        TokenType.RPAREN,
        "Expected ')' after expression"
      );
      return {
        id: this.nextId(),
        kind: ASTNodeKind.GroupingExpression,
        span: { start: token.span.start, end: closeParen.span.end },
        expression: expr,
      };
    }

    // Fallback error
    this.reportError(`Unexpected token '${token.value}' in expression`, token.span);
    this.advance();
    return {
      id: this.nextId(),
      kind: ASTNodeKind.LiteralExpression,
      span: token.span,
      literalType: "int",
      value: 0,
      raw: "0",
    };
  }

  // -------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------

  private parseTypeNode(): TypeNode {
    const token = this.currentToken();
    if (!this.isType(token.type)) {
      this.reportError(`Expected type name, found '${token.value}'`, token.span);
      return {
        name: "int",
        span: token.span,
      };
    }
    this.advance();
    return {
      name: token.value as MiniLangType,
      span: token.span,
    };
  }

  private isType(type: TokenType): boolean {
    return isTypeKeyword(type);
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return type === TokenType.EOF;
    return this.currentToken().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.cursor++;
    return this.peekPrevious();
  }

  private isAtEnd(): boolean {
    return this.currentToken().type === TokenType.EOF;
  }

  private currentToken(): Token {
    if (this.cursor >= this.tokens.length) {
      return this.tokens[this.tokens.length - 1];
    }
    return this.tokens[this.cursor];
  }

  private peekNextToken(): Token {
    if (this.cursor + 1 >= this.tokens.length) {
      return this.tokens[this.tokens.length - 1];
    }
    return this.tokens[this.cursor + 1];
  }

  private peekPrevious(): Token {
    if (this.cursor === 0) return this.tokens[0];
    return this.tokens[this.cursor - 1];
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();

    const current = this.currentToken();
    const error: ParserError = {
      message: `${message}. Found '${current.value}' instead.`,
      span: current.span,
      expected: [type],
      found: current.value,
      suggestion: getExpectedSuggestion(type, current),
    };
    this.errors.push(error);
    throw error;
  }

  private reportError(message: string, span: Span): void {
    this.errors.push({
      message,
      span,
    });
  }

  private synchronize(): void {
    // If we're already sitting on a sync token (e.g. a type keyword that
    // starts the next valid statement), do NOT advance past it — just return
    // so the outer loop can parse it normally.
    if (SYNC_TOKENS.has(this.currentToken().type)) return;

    this.advance();

    while (!this.isAtEnd()) {
      // Stop after a semicolon: next token begins a fresh statement.
      if (this.peekPrevious().type === TokenType.SEMICOLON) return;
      // Stop *before* consuming a statement-starting keyword.
      if (SYNC_TOKENS.has(this.currentToken().type)) return;
      this.advance();
    }
  }

  private nextId(): string {
    return `node_${++this.nodeIdCounter}`;
  }
}
