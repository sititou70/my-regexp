import { Cast } from "../../utils/Cast";

export type TokenChar = { kind: "token"; type: "Char"; value: string };
export type TokenBar = { kind: "token"; type: "Bar" };
export type TokenStar = { kind: "token"; type: "Star" };
export type TokenLeftParenthesis = { kind: "token"; type: "LeftParenthesis" };
export type TokenRightParenthesis = { kind: "token"; type: "RightParenthesis" };
export type TokenEnd = {
  kind: "token";
  type: "End";
};

export type Token =
  | TokenChar
  | TokenBar
  | TokenStar
  | TokenLeftParenthesis
  | TokenRightParenthesis
  | TokenEnd;

export const isToken = (token: unknown): token is Token => {
  if (typeof token !== "object") return false;
  if (token === null) return false;
  if (!("kind" in token)) return false;
  if (token.kind !== "token") return false;
  if (!("type" in token)) return false;
  if (typeof token.type !== "string") return false;

  return true;
};

type TokenByType<Type extends Token["type"], T = Token> = T extends unknown
  ? Type extends Cast<T, Token>["type"]
    ? T
    : never
  : never;
export const isTokenType = <Type extends Token["type"]>(
  token: unknown,
  type: Type
): token is TokenByType<Type> => {
  if (!isToken(token)) return false;
  if (token.type !== type) return false;

  return true;
};
