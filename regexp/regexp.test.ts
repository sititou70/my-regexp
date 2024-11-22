import { regexp } from "./regexp";

test.each`
  pattern | input   | match
  ${"ab"} | ${"ab"} | ${true}
  ${"ab"} | ${"a"}  | ${false}
  ${"ab"} | ${"b"}  | ${false}
`(
  "concat: pattern $pattern, input: $input, match: $match",
  ({ pattern, input, match }) => {
    const result = regexp(pattern, input);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.value).toBe(match);
  }
);

test.each`
  pattern  | input  | match
  ${"a|b"} | ${"a"} | ${true}
  ${"a|b"} | ${"b"} | ${true}
  ${"a|b"} | ${"c"} | ${false}
`(
  "select: pattern $pattern, input: $input, match: $match",
  ({ pattern, input, match }) => {
    const result = regexp(pattern, input);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.value).toBe(match);
  }
);

test.each`
  pattern | input    | match
  ${"a*"} | ${""}    | ${true}
  ${"a*"} | ${"a"}   | ${true}
  ${"a*"} | ${"aa"}  | ${true}
  ${"a*"} | ${"aaa"} | ${true}
`(
  "star: pattern $pattern, input: $input, match: $match",
  ({ pattern, input, match }) => {
    const result = regexp(pattern, input);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.value).toBe(match);
  }
);

test.each`
  pattern     | input        | match
  ${"(ab)*c"} | ${"abc"}     | ${true}
  ${"(ab)*c"} | ${"ababc"}   | ${true}
  ${"(ab)*c"} | ${"abababc"} | ${true}
  ${"(ab)*c"} | ${"c"}       | ${true}
  ${"(ab)*c"} | ${"bc"}      | ${false}
  ${"(ab)*c"} | ${"abbc"}    | ${false}
  ${"(ab)*c"} | ${"ababab"}  | ${false}
`(
  "case1: pattern $pattern, input: $input, match: $match",
  ({ pattern, input, match }) => {
    const result = regexp(pattern, input);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.value).toBe(match);
  }
);

test.each`
  pattern       | input      | match
  ${"1*(2|3)4"} | ${"124"}   | ${true}
  ${"1*(2|3)4"} | ${"134"}   | ${true}
  ${"1*(2|3)4"} | ${"1124"}  | ${true}
  ${"1*(2|3)4"} | ${"1124"}  | ${true}
  ${"1*(2|3)4"} | ${"11124"} | ${true}
  ${"1*(2|3)4"} | ${"11134"} | ${true}
  ${"1*(2|3)4"} | ${"24"}    | ${true}
  ${"1*(2|3)4"} | ${"34"}    | ${true}
  ${"1*(2|3)4"} | ${"14"}    | ${false}
  ${"1*(2|3)4"} | ${"13"}    | ${false}
`(
  "case2: pattern $pattern, input: $input, match: $match",
  ({ pattern, input, match }) => {
    const result = regexp(pattern, input);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.value).toBe(match);
  }
);

test.each`
  pattern                 | input                 | match
  ${"ab(((cd)|(ef))*)gh"} | ${"abcdgh"}           | ${true}
  ${"ab(((cd)|(ef))*)gh"} | ${"abefgh"}           | ${true}
  ${"ab(((cd)|(ef))*)gh"} | ${"abcdcdgh"}         | ${true}
  ${"ab(((cd)|(ef))*)gh"} | ${"abefefgh"}         | ${true}
  ${"ab(((cd)|(ef))*)gh"} | ${"abcdefgh"}         | ${true}
  ${"ab(((cd)|(ef))*)gh"} | ${"abcdefcdefefcdgh"} | ${true}
  ${"ab(((cd)|(ef))*)gh"} | ${"abcdefcdefefcgh"}  | ${false}
`(
  "case3: pattern $pattern, input: $input, match: $match",
  ({ pattern, input, match }) => {
    const result = regexp(pattern, input);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.value).toBe(match);
  }
);

test.each`
  pattern                                   | input             | match
  ${"Windows ((95)|(98)|(2000)|(ME)|(XP))"} | ${"Windows 95"}   | ${true}
  ${"Windows ((95)|(98)|(2000)|(ME)|(XP))"} | ${"Windows 98"}   | ${true}
  ${"Windows ((95)|(98)|(2000)|(ME)|(XP))"} | ${"Windows 2000"} | ${true}
  ${"Windows ((95)|(98)|(2000)|(ME)|(XP))"} | ${"Windows ME"}   | ${true}
  ${"Windows ((95)|(98)|(2000)|(ME)|(XP))"} | ${"Windows XP"}   | ${true}
  ${"Windows ((95)|(98)|(2000)|(ME)|(XP))"} | ${"Windows 9"}    | ${false}
`(
  "case3: pattern $pattern, input: $input, match: $match",
  ({ pattern, input, match }) => {
    const result = regexp(pattern, input);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.value).toBe(match);
  }
);
