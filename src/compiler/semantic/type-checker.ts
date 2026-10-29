import { MiniLangType, BinaryOperator, UnaryOperator } from "../ast/nodes";

export class TypeChecker {
  public static areTypesCompatible(target: MiniLangType, source: MiniLangType): boolean {
    if (target === "error" || source === "error") return true; // suppress cascading errors
    if (target === source) return true;

    // Promotion: float can accept int
    if (target === "float" && source === "int") return true;

    return false;
  }

  public static checkBinaryOp(
    op: BinaryOperator,
    left: MiniLangType,
    right: MiniLangType
  ): { resultType: MiniLangType; error?: string } {
    if (left === "error" || right === "error") {
      return { resultType: "error" };
    }

    switch (op) {
      case "+":
        if (left === "string" || right === "string") {
          return { resultType: "string" };
        }
        if (left === "int" && right === "int") return { resultType: "int" };
        if (
          (left === "float" && right === "float") ||
          (left === "int" && right === "float") ||
          (left === "float" && right === "int")
        ) {
          return { resultType: "float" };
        }
        return {
          resultType: "error",
          error: `Operator '+' cannot be applied to types '${left}' and '${right}'`,
        };

      case "-":
      case "*":
        if (left === "int" && right === "int") return { resultType: "int" };
        if (
          (left === "float" && right === "float") ||
          (left === "int" && right === "float") ||
          (left === "float" && right === "int")
        ) {
          return { resultType: "float" };
        }
        return {
          resultType: "error",
          error: `Operator '${op}' requires numeric types, got '${left}' and '${right}'`,
        };

      case "/":
        if (
          (left === "int" || left === "float") &&
          (right === "int" || right === "float")
        ) {
          if (left === "int" && right === "int") return { resultType: "int" };
          return { resultType: "float" };
        }
        return {
          resultType: "error",
          error: `Operator '/' requires numeric types, got '${left}' and '${right}'`,
        };

      case "%":
        if (left === "int" && right === "int") {
          return { resultType: "int" };
        }
        return {
          resultType: "error",
          error: `Operator '%' requires integer operands, got '${left}' and '${right}'`,
        };

      case "<":
      case "<=":
      case ">":
      case ">=":
        if (
          (left === "int" || left === "float") &&
          (right === "int" || right === "float")
        ) {
          return { resultType: "bool" };
        }
        return {
          resultType: "error",
          error: `Relational comparison '${op}' requires numeric operands, got '${left}' and '${right}'`,
        };

      case "==":
      case "!=":
        if (left === right) return { resultType: "bool" };
        if (
          (left === "int" && right === "float") ||
          (left === "float" && right === "int")
        ) {
          return { resultType: "bool" };
        }
        return {
          resultType: "error",
          error: `Equality comparison '${op}' cannot compare dissimilar types '${left}' and '${right}'`,
        };

      case "&&":
      case "||":
        if (left === "bool" && right === "bool") {
          return { resultType: "bool" };
        }
        return {
          resultType: "error",
          error: `Logical operator '${op}' requires boolean operands, got '${left}' and '${right}'`,
        };

      default:
        return {
          resultType: "error",
          error: `Unsupported binary operator '${op}'`,
        };
    }
  }

  public static checkUnaryOp(
    op: UnaryOperator,
    operand: MiniLangType
  ): { resultType: MiniLangType; error?: string } {
    if (operand === "error") return { resultType: "error" };

    if (op === "-") {
      if (operand === "int" || operand === "float") {
        return { resultType: operand };
      }
      return {
        resultType: "error",
        error: `Unary negation '-' requires numeric operand, got '${operand}'`,
      };
    }

    if (op === "!") {
      if (operand === "bool") {
        return { resultType: "bool" };
      }
      return {
        resultType: "error",
        error: `Logical NOT '!' requires boolean operand, got '${operand}'`,
      };
    }

    return { resultType: "error", error: `Unknown unary operator '${op}'` };
  }
}
