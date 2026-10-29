# MiniLang Formal Grammar Specification

MiniLang is a strongly-typed, imperative programming language designed for compiler education. It supports fundamental programming abstractions including primitive data types, control flow structures, first-class scoping, recursive functions, and standard I/O.

---

## 1. Extended Backus-Naur Form (EBNF)

```ebnf
Program        ::= Declaration*
Declaration    ::= FuncDecl | VarDecl | Statement

FuncDecl       ::= "function" Type Identifier "(" ParamList? ")" Block
ParamList      ::= Param ("," Param)*
Param          ::= Type Identifier

VarDecl        ::= Type Identifier ("=" Expression)? ";"
Type           ::= "int" | "float" | "bool" | "string" | "void"

Block          ::= "{" Statement* "}"
Statement      ::= VarDecl
               |   AssignStmt
               |   IfStmt
               |   WhileStmt
               |   ForStmt
               |   ReturnStmt
               |   PrintStmt
               |   ExprStmt
               |   Block

AssignStmt     ::= Identifier "=" Expression ";"
IfStmt         ::= "if" "(" Expression ")" Block ("else" Block)?
WhileStmt      ::= "while" "(" Expression ")" Block
ForStmt        ::= "for" "(" (VarDecl | AssignStmt | ";") Expression? ";" Expression? ")" Block
ReturnStmt     ::= "return" Expression? ";"
PrintStmt      ::= "print" "(" Expression ("," Expression)* ")" ";"
ExprStmt       ::= Expression ";"

Expression     ::= LogicalOr
LogicalOr      ::= LogicalAnd ("||" LogicalAnd)*
LogicalAnd     ::= Equality ("&&" Equality)*
Equality       ::= Comparison (("==" | "!=") Comparison)*
Comparison     ::= Addition (("<" | ">" | "<=" | ">=") Addition)*
Addition       ::= Multiplication (("+" | "-") Multiplication)*
Multiplication ::= Unary (("*" | "/" | "%") Unary)*
Unary          ::= ("!" | "-") Unary | Primary
Primary        ::= Literal | Identifier | "(" Expression ")" | CallExpr
CallExpr       ::= Identifier "(" ArgList? ")"
ArgList        ::= Expression ("," Expression)*

Literal        ::= INTEGER | FLOAT | BOOLEAN | STRING
INTEGER        ::= [0-9]+
FLOAT          ::= [0-9]+ "." [0-9]+
BOOLEAN        ::= "true" | "false"
STRING         ::= '"' [^"\\]* ('\\.' [^"\\]*)* '"'
Identifier     ::= [a-zA-Z_][a-zA-Z0-9_]*
```

---

## 2. Operator Precedence and Associativity

Operators are listed from highest precedence (binds tightest) to lowest precedence:

| Precedence | Operator | Description | Associativity |
| :--- | :--- | :--- | :--- |
| **8 (Highest)** | `()` | Function Call, Grouping | Left-to-right |
| **7** | `!`, `-` | Logical NOT, Unary Negation | Right-to-left |
| **6** | `*`, `/`, `%` | Multiplication, Division, Modulo | Left-to-right |
| **5** | `+`, `-` | Addition, Subtraction, String Concatenation | Left-to-right |
| **4** | `<`, `<=`, `>`, `>=` | Relational Comparisons | Left-to-right |
| **3** | `==`, `!=` | Equality and Inequality | Left-to-right |
| **2** | `&&` | Logical Conjunction (Short-circuit) | Left-to-right |
| **1** | `\|\|` | Logical Disjunction (Short-circuit) | Left-to-right |
| **0 (Lowest)** | `=` | Variable Assignment | Right-to-left |

---

## 3. Lexical Rules

### 3.1 Identifiers
- Identifiers begin with an ASCII letter `[a-zA-Z]` or underscore `_`.
- Subsequent characters may include letters, digits `[0-9]`, and underscores.
- Keywords are reserved and cannot be used as identifiers.

### 3.2 Keywords
`function`, `int`, `float`, `bool`, `string`, `void`, `if`, `else`, `while`, `for`, `return`, `print`, `true`, `false`

### 3.3 Literals
- **Integer**: Sequences of digits without fractional points, e.g., `0`, `42`, `1000`.
- **Float**: Sequences of digits with a decimal point and fractional digits, e.g., `3.14`, `0.5`.
- **Boolean**: Exact keywords `true` and `false`.
- **String**: Enclosed in double quotes `"..."`. Supports escape sequences: `\"`, `\\`, `\n`, `\t`, `\r`.

### 3.4 Comments and Whitespace
- Single-line comments: `// ...` to end of line.
- Multi-line comments: `/* ... */`, non-nesting.
- Whitespace characters (` `, `\t`, `\r`, `\n`) are ignored except as token delimiters.

---

## 4. Semantic Rules & Constraints

1. **Scope and Shadowing**:
   - Variables are statically scoped within blocks `{ ... }`.
   - Inner scopes can shadow identifiers in outer scopes.
   - Re-declaration of an identifier within the exact same scope is a compile error.
2. **Typing**:
   - Variables must be declared with an explicit primitive type (`int`, `float`, `bool`, `string`).
   - Binary arithmetic (`+`, `-`, `*`, `/`, `%`) requires compatible numeric operands (`int`, `float`). `+` also supports `string` concatenation.
   - Logical operators (`&&`, `||`, `!`) require `bool` operands.
   - Comparison operators (`<`, `<=`, `>`, `>=`) require numeric operands and yield `bool`.
   - Equality operators (`==`, `!=`) require identical operand types and yield `bool`.
3. **Control Flow**:
   - Condition expressions for `if`, `while`, and `for` must evaluate to `bool`.
   - `return` statements must match the enclosing function's declared return type.
   - Non-void functions must guarantee a `return` along all deterministic control flow branches.
4. **Function Calls**:
   - Functions must be declared prior to invocation or resolved via multi-pass analysis.
   - Arity and argument types must strictly match formal parameter types.
