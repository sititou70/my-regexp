import { tokenize } from "./lexer";

test("tokenize", () => {
  expect(tokenize("ab(cd|ef)*dh")).toEqual({
    success: true,
    value: [
      { kind: "token", type: "Char", value: "a" },
      { kind: "token", type: "Char", value: "b" },
      { kind: "token", type: "LeftParenthesis" },
      { kind: "token", type: "Char", value: "c" },
      { kind: "token", type: "Char", value: "d" },
      { kind: "token", type: "Bar" },
      { kind: "token", type: "Char", value: "e" },
      { kind: "token", type: "Char", value: "f" },
      { kind: "token", type: "RightParenthesis" },
      { kind: "token", type: "Star" },
      { kind: "token", type: "Char", value: "d" },
      { kind: "token", type: "Char", value: "h" },
      { kind: "token", type: "End" },
    ],
  });
});
