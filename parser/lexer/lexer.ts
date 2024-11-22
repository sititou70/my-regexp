import { Result, error, ok } from "../../utils/Result";
import { Token } from "./types";

type LexingContext = {
  rest_input: string;
  tokens: Token[];
};

const makeRegExpTokenizer =
  (regexp: RegExp, token: Token) =>
  (context: LexingContext): Result<LexingContext> => {
    let is_replaced = false;
    const replaced_input = context.rest_input.replace(regexp, () => {
      is_replaced = true;
      return "";
    });
    if (!is_replaced) return error();

    return ok({
      rest_input: replaced_input,
      tokens: [...context.tokens, token],
    });
  };

const makeRegExpMatchingTokenizer =
  (regexp: RegExp, matchCallBack: (matched: RegExpMatchArray) => Token) =>
  (context: LexingContext): Result<LexingContext> => {
    const matched = context.rest_input.match(regexp);
    if (matched === null) return error();

    const replaced_input = context.rest_input.replace(regexp, "");

    return ok({
      rest_input: replaced_input,
      tokens: [...context.tokens, matchCallBack(matched)],
    });
  };

export const tokenize = (input: string): Result<LexingContext["tokens"]> => {
  // preprocessing
  const preprocessed_input = input
    .replace(/\/\/.*$/gm, "")
    .replace(/^[ \r\n]*/g, "")
    .replace(/[ \r\n]*$/g, "");

  // analysis
  const tokenizers = [
    makeRegExpTokenizer(/^\|/, { kind: "token", type: "Bar" }),
    makeRegExpTokenizer(/^\*/, { kind: "token", type: "Star" }),
    makeRegExpTokenizer(/^\(/, { kind: "token", type: "LeftParenthesis" }),
    makeRegExpTokenizer(/^\)/, { kind: "token", type: "RightParenthesis" }),
    makeRegExpMatchingTokenizer(/^[a-zA-Z0-9 ]/, (matched) => ({
      kind: "token",
      type: "Char",
      value: matched[0],
    })),
  ];
  const readSingleToken = (context: LexingContext): Result<LexingContext> => {
    for (const tokenizer of tokenizers) {
      const result = tokenizer(context);
      if (result.success) return result;
    }

    return error();
  };

  let context: LexingContext = { rest_input: preprocessed_input, tokens: [] };
  while (context.rest_input !== "") {
    const result = readSingleToken(context);
    if (!result.success) return error({ msg: "Invalid token", context });

    context = result.value;
  }

  return ok([...context.tokens, { kind: "token", type: "End" }]);
};
