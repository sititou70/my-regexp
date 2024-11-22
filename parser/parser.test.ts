import { parse } from "./parser";

test("concat", () => {
  const result = parse("ab");

  expect(result.success).toBe(true);
  if (!result.success) return;

  expect(result.value).toMatchObject({
    kind: "ast",
    type: "Concat",
    ast_left: { kind: "ast", type: "Char", value: "a" },
    ast_right: { kind: "ast", type: "Char", value: "b" },
  });
});

test("select", () => {
  const result = parse("a|b");

  expect(result.success).toBe(true);
  if (!result.success) return;

  expect(result.value).toMatchObject({
    kind: "ast",
    type: "Select",
    ast1: { kind: "ast", type: "Char", value: "a" },
    ast2: { kind: "ast", type: "Char", value: "b" },
  });
});

test("star", () => {
  const result = parse("a*");

  expect(result.success).toBe(true);
  if (!result.success) return;

  expect(result.value).toMatchObject({
    kind: "ast",
    type: "Star",
    ast: { kind: "ast", type: "Char", value: "a" },
  });
});

test("parenthesis", () => {
  const result = parse("(a)");

  expect(result.success).toBe(true);
  if (!result.success) return;

  expect(result.value).toMatchObject({ kind: "ast", type: "Char", value: "a" });
});

// from: https://github.com/sosukesuzuki/oregexp/tree/main/packages/oregexp-parser
test("case1", () => {
  const result = parse("(ab)*c");

  expect(result.success).toBe(true);
  if (!result.success) return;

  expect(result.value).toMatchObject({
    kind: "ast",
    type: "Concat",
    ast_left: {
      kind: "ast",
      type: "Star",
      ast: {
        kind: "ast",
        type: "Concat",
        ast_left: { kind: "ast", type: "Char", value: "a" },
        ast_right: { kind: "ast", type: "Char", value: "b" },
      },
    },
    ast_right: { kind: "ast", type: "Char", value: "c" },
  });
});

test("case2", () => {
  const result = parse("1*(2|3)4");

  expect(result.success).toBe(true);
  if (!result.success) return;

  expect(result.value).toMatchObject({
    kind: "ast",
    type: "Concat",
    ast_left: {
      kind: "ast",
      type: "Concat",
      ast_left: {
        kind: "ast",
        type: "Star",
        ast: { kind: "ast", type: "Char", value: "1" },
      },
      ast_right: {
        kind: "ast",
        type: "Select",
        ast1: { kind: "ast", type: "Char", value: "2" },
        ast2: { kind: "ast", type: "Char", value: "3" },
      },
    },
    ast_right: { kind: "ast", type: "Char", value: "4" },
  });
});

test("case3", () => {
  const result = parse("ab(((cd)|(ef))*)gh");

  expect(result.success).toBe(true);
  if (!result.success) return;

  expect(result.value).toMatchObject({
    kind: "ast",
    type: "Concat",
    ast_left: {
      kind: "ast",
      type: "Concat",
      ast_left: {
        kind: "ast",
        type: "Concat",
        ast_left: {
          kind: "ast",
          type: "Concat",
          ast_left: { kind: "ast", type: "Char", value: "a" },
          ast_right: { kind: "ast", type: "Char", value: "b" },
        },
        ast_right: {
          kind: "ast",
          type: "Star",
          ast: {
            kind: "ast",
            type: "Select",
            ast1: {
              kind: "ast",
              type: "Concat",
              ast_left: { kind: "ast", type: "Char", value: "c" },
              ast_right: { kind: "ast", type: "Char", value: "d" },
            },
            ast2: {
              kind: "ast",
              type: "Concat",
              ast_left: { kind: "ast", type: "Char", value: "e" },
              ast_right: { kind: "ast", type: "Char", value: "f" },
            },
          },
        },
      },
      ast_right: { kind: "ast", type: "Char", value: "g" },
    },
    ast_right: { kind: "ast", type: "Char", value: "h" },
  });
});
