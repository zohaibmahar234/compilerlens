import { Span } from "../lexer/tokens";

export type MiniLangType = "int" | "float" | "bool" | "string" | "void" | "error" | "unknown";

export enum ASTNodeKind {
  Program = "Program",
  FunctionDeclaration = "FunctionDeclaration",
  Parameter = "Parameter",
  VariableDeclaration = "VariableDeclaration",
  BlockStatement = "BlockStatement",
  AssignmentStatement = "AssignmentStatement",
  IfStatement = "IfStatement",
  WhileStatement = "WhileStatement",
  ForStatement = "ForStatement",
  ReturnStatement = "ReturnStatement",
  PrintStatement = "PrintStatement",
  ExpressionStatement = "ExpressionStatement",

  BinaryExpression = "BinaryExpression",
  UnaryExpression = "UnaryExpression",
  CallExpression = "CallExpression",
  IdentifierExpression = "IdentifierExpression",
  LiteralExpression = "LiteralExpression",
  GroupingExpression = "GroupingExpression",
}

export interface BaseASTNode {
  id: string;
  kind: ASTNodeKind;
  span: Span;
  inferredType?: MiniLangType;
}

export interface TypeNode {
  name: MiniLangType;
  span: Span;
}

export interface Parameter extends BaseASTNode {
  kind: ASTNodeKind.Parameter;
  typeNode: TypeNode;
  name: string;
}

export interface FunctionDeclaration extends BaseASTNode {
  kind: ASTNodeKind.FunctionDeclaration;
  returnType: TypeNode;
  name: string;
  parameters: Parameter[];
  body: BlockStatement;
}

export interface VariableDeclaration extends BaseASTNode {
  kind: ASTNodeKind.VariableDeclaration;
  typeNode: TypeNode;
  name: string;
  initializer?: Expression;
}

export interface BlockStatement extends BaseASTNode {
  kind: ASTNodeKind.BlockStatement;
  statements: Statement[];
}

export interface AssignmentStatement extends BaseASTNode {
  kind: ASTNodeKind.AssignmentStatement;
  target: string;
  value: Expression;
}

export interface IfStatement extends BaseASTNode {
  kind: ASTNodeKind.IfStatement;
  condition: Expression;
  consequent: BlockStatement;
  alternate?: BlockStatement;
}

export interface WhileStatement extends BaseASTNode {
  kind: ASTNodeKind.WhileStatement;
  condition: Expression;
  body: BlockStatement;
}

export interface ForStatement extends BaseASTNode {
  kind: ASTNodeKind.ForStatement;
  initializer?: VariableDeclaration | AssignmentStatement;
  condition?: Expression;
  /** The update step: may be an assignment (e.g. i = i + 1) or a bare expression. */
  update?: AssignmentStatement | Expression;
  body: BlockStatement;
}

export interface ReturnStatement extends BaseASTNode {
  kind: ASTNodeKind.ReturnStatement;
  argument?: Expression;
}

export interface PrintStatement extends BaseASTNode {
  kind: ASTNodeKind.PrintStatement;
  arguments: Expression[];
}

export interface ExpressionStatement extends BaseASTNode {
  kind: ASTNodeKind.ExpressionStatement;
  expression: Expression;
}

export type Statement =
  | VariableDeclaration
  | AssignmentStatement
  | IfStatement
  | WhileStatement
  | ForStatement
  | ReturnStatement
  | PrintStatement
  | ExpressionStatement
  | BlockStatement;

export type Declaration = FunctionDeclaration | VariableDeclaration | Statement;

export interface Program extends BaseASTNode {
  kind: ASTNodeKind.Program;
  declarations: Declaration[];
}

export type BinaryOperator =
  | "+"
  | "-"
  | "*"
  | "/"
  | "%"
  | "=="
  | "!="
  | "<"
  | "<="
  | ">"
  | ">="
  | "&&"
  | "||";

export interface BinaryExpression extends BaseASTNode {
  kind: ASTNodeKind.BinaryExpression;
  left: Expression;
  operator: BinaryOperator;
  right: Expression;
}

export type UnaryOperator = "-" | "!";

export interface UnaryExpression extends BaseASTNode {
  kind: ASTNodeKind.UnaryExpression;
  operator: UnaryOperator;
  operand: Expression;
}

export interface CallExpression extends BaseASTNode {
  kind: ASTNodeKind.CallExpression;
  callee: string;
  arguments: Expression[];
}

export interface IdentifierExpression extends BaseASTNode {
  kind: ASTNodeKind.IdentifierExpression;
  name: string;
}

export interface LiteralExpression extends BaseASTNode {
  kind: ASTNodeKind.LiteralExpression;
  literalType: "int" | "float" | "bool" | "string";
  value: number | boolean | string;
  raw: string;
}

export interface GroupingExpression extends BaseASTNode {
  kind: ASTNodeKind.GroupingExpression;
  expression: Expression;
}

export type Expression =
  | BinaryExpression
  | UnaryExpression
  | CallExpression
  | IdentifierExpression
  | LiteralExpression
  | GroupingExpression;

export type ASTNode = Program | Declaration | Statement | Expression | Parameter;
