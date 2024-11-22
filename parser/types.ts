import { Cast } from "../utils/Cast";

export type ASTChar = {
  kind: "ast";
  type: "Char";
  value: string;
};
export type ASTConcat = {
  kind: "ast";
  type: "Concat";
  ast_left: AST;
  ast_right: AST;
};
export type ASTSelect = {
  kind: "ast";
  type: "Select";
  ast1: AST;
  ast2: AST;
};
export type ASTStar = {
  kind: "ast";
  type: "Star";
  ast: AST;
};

export type AST = ASTChar | ASTConcat | ASTSelect | ASTStar;

export const isAST = (ast: unknown): ast is AST => {
  if (typeof ast !== "object") return false;
  if (ast === null) return false;
  if (!("kind" in ast)) return false;
  if (ast.kind !== "ast") return false;
  if (!("type" in ast)) return false;
  if (typeof ast.type !== "string") return false;

  return true;
};

type ASTByType<Type extends AST["type"], T = AST> = T extends unknown
  ? Type extends Cast<T, AST>["type"]
    ? T
    : never
  : never;
export const isASTType = <Type extends AST["type"]>(
  ast: unknown,
  type: Type
): ast is ASTByType<Type> => {
  if (!isAST(ast)) return false;
  if (ast.type !== type) return false;

  return true;
};
