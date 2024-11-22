import { Result, error, ok } from "../utils/Result";
import { Token, isTokenType } from "./lexer/types";
import {
  AST,
  ASTChar,
  ASTConcat,
  ASTSelect,
  ASTStar,
  isAST,
  isASTType,
} from "./types";

type Syntax<NonterminalSymbol extends string> = {
  initial_symbol: NonterminalSymbol;
  rules: {
    symbol: NonterminalSymbol;
    expression: (NonterminalSymbol | Token["type"])[];
    callback: (symbols: (AST | Token)[]) => Result<AST>;
  }[];
};

export const SYNTAX: Syntax<"**start**" | "Term"> = {
  initial_symbol: "**start**",
  rules: [
    {
      symbol: "**start**",
      expression: ["Term", "End"],
      callback: (symbols): Result<AST> => {
        const term = symbols[0];
        if (!isAST(term)) return error();

        return ok(term);
      },
    },

    {
      symbol: "Term",
      expression: ["Char"],
      callback: (symbols): Result<ASTChar> => {
        const char = symbols[0];
        if (!isTokenType(char, "Char")) return error();

        return ok({
          kind: "ast",
          type: "Char",
          value: char.value,
        });
      },
    },
    {
      symbol: "Term",
      expression: ["Term", "Term"],
      callback: (symbols): Result<ASTConcat> => {
        const ast_left = symbols[0];
        const ast_right = symbols[1];
        if (!isAST(ast_left)) return error();
        if (!isAST(ast_right)) return error();

        return ok({
          kind: "ast",
          type: "Concat",
          ast_left,
          ast_right,
        });
      },
    },
    {
      symbol: "Term",
      expression: ["Term", "Bar", "Term"],
      callback: (symbols): Result<ASTSelect> => {
        const ast1 = symbols[0];
        const ast2 = symbols[2];
        if (!isAST(ast1)) return error();
        if (!isAST(ast2)) return error();

        return ok({ kind: "ast", type: "Select", ast1, ast2 });
      },
    },
    {
      symbol: "Term",
      expression: ["Term", "Star"],
      callback: (symbols): Result<ASTStar> => {
        const ast = symbols[0];
        if (!isAST(ast)) return error();

        return ok({ kind: "ast", type: "Star", ast });
      },
    },

    {
      symbol: "Term",
      expression: ["LeftParenthesis", "Term", "RightParenthesis"],
      callback: (symbols) => {
        const term = symbols[1];
        if (!isAST(term)) return error();

        return ok(term);
      },
    },
  ],
};
