import { Span } from "../lexer/tokens";
import { MiniLangType } from "../ast/nodes";

export type SymbolKind = "variable" | "parameter" | "function";

export interface Symbol {
  name: string;
  type: MiniLangType;
  kind: SymbolKind;
  span: Span;
  scopeId: number;
  scopeLevel: number;
  isInitialized: boolean;
  references: Span[];
  paramTypes?: MiniLangType[];
}

export class Scope {
  public readonly id: number;
  public readonly name: string;
  public readonly parent: Scope | null;
  public readonly children: Scope[] = [];
  public readonly level: number;
  public readonly symbols: Map<string, Symbol> = new Map();

  constructor(id: number, name: string, parent: Scope | null = null, level = 0) {
    this.id = id;
    this.name = name;
    this.parent = parent;
    this.level = level;
  }

  public define(symbol: Symbol): boolean {
    if (this.symbols.has(symbol.name)) {
      return false; // Redeclaration in same scope
    }
    this.symbols.set(symbol.name, symbol);
    return true;
  }

  public lookupLocal(name: string): Symbol | undefined {
    return this.symbols.get(name);
  }

  public lookup(name: string): Symbol | undefined {
    let current: Scope | null = this;
    while (current) {
      const sym = current.symbols.get(name);
      if (sym) return sym;
      current = current.parent;
    }
    return undefined;
  }
}

export class SymbolTable {
  private scopeCounter = 0;
  public readonly rootScope: Scope;
  public currentScope: Scope;
  public readonly allScopes: Scope[] = [];

  constructor() {
    this.rootScope = new Scope(this.scopeCounter++, "Global", null, 0);
    this.currentScope = this.rootScope;
    this.allScopes.push(this.rootScope);
  }

  public enterScope(name: string): Scope {
    const newScope = new Scope(
      this.scopeCounter++,
      name,
      this.currentScope,
      this.currentScope.level + 1
    );
    this.currentScope.children.push(newScope);
    this.currentScope = newScope;
    this.allScopes.push(newScope);
    return newScope;
  }

  public exitScope(): Scope | null {
    if (this.currentScope.parent) {
      this.currentScope = this.currentScope.parent;
      return this.currentScope;
    }
    return null;
  }

  public define(
    name: string,
    type: MiniLangType,
    kind: SymbolKind,
    span: Span,
    isInitialized = false,
    paramTypes?: MiniLangType[]
  ): { success: boolean; symbol?: Symbol } {
    const symbol: Symbol = {
      name,
      type,
      kind,
      span,
      scopeId: this.currentScope.id,
      scopeLevel: this.currentScope.level,
      isInitialized,
      references: [],
      paramTypes,
    };

    const success = this.currentScope.define(symbol);
    return { success, symbol: success ? symbol : undefined };
  }

  public lookup(name: string): Symbol | undefined {
    return this.currentScope.lookup(name);
  }

  public lookupCurrentScope(name: string): Symbol | undefined {
    return this.currentScope.lookupLocal(name);
  }

  public recordReference(name: string, span: Span): void {
    const symbol = this.lookup(name);
    if (symbol) {
      symbol.references.push(span);
    }
  }

  public getAllSymbols(): Symbol[] {
    const list: Symbol[] = [];
    for (const scope of this.allScopes) {
      list.push(...Array.from(scope.symbols.values()));
    }
    return list;
  }
}
