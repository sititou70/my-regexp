import {
  ExecDFAContext,
  NFA,
  automaton_epsilon_input,
  constructDFAFromNFA,
  execDFA,
} from "./automaton";

// see: https://ja.wikipedia.org/wiki/%E9%83%A8%E5%88%86%E9%9B%86%E5%90%88%E6%A7%8B%E6%88%90%E6%B3%95#.E4.BE.8B
const example_nfa: NFA = {
  initial_state: "1",
  transitions: new Map([
    [
      "1",
      new Map([
        [automaton_epsilon_input, new Set(["3"])],
        ["0", new Set(["2"])],
      ]),
    ],
    ["2", new Map([["1", new Set(["2", "4"])]])],
    [
      "3",
      new Map([
        [automaton_epsilon_input, new Set(["2"])],
        ["0", new Set(["4"])],
      ]),
    ],
    ["4", new Map([["0", new Set(["3"])]])],
  ]),
  accepting_states: new Set(["3", "4"]),
};

test("constructDFAFromNFA", () => {
  const dfa = constructDFAFromNFA(example_nfa);

  expect(dfa.initial_state).toBe("1|2|3");

  expect(dfa.transitions.size).toBe(4);
  expect(dfa.transitions.get("1|2|3")?.get("0")).toBe("2|4");
  expect(dfa.transitions.get("1|2|3")?.get("1")).toBe("2|4");
  expect(dfa.transitions.get("2|4")?.get("0")).toBe("2|3");
  expect(dfa.transitions.get("2|4")?.get("1")).toBe("2|4");
  expect(dfa.transitions.get("2|3")?.get("0")).toBe("4");
  expect(dfa.transitions.get("2|3")?.get("1")).toBe("2|4");
  expect(dfa.transitions.get("4")?.get("0")).toBe("2|3");
  expect(dfa.transitions.get("4")?.get("1")).toBe(undefined);

  expect(dfa.accepting_states.size).toBe(4);
  expect(dfa.accepting_states.has("1|2|3")).toBe(true);
  expect(dfa.accepting_states.has("2|4")).toBe(true);
  expect(dfa.accepting_states.has("2|3")).toBe(true);
  expect(dfa.accepting_states.has("4")).toBe(true);
});

describe("exec example nfa", () => {
  const dfa = constructDFAFromNFA(example_nfa);

  test.each([
    ["0", true],
    ["1", true],

    ["00", true],
    ["01", true],
    ["10", true],
    ["11", true],

    ["000", true],
    ["001", true],
    ["010", true],
    ["011", true],
    ["100", true],
    ["101", true],
    ["110", true],
    ["111", true],

    ["0000", true],
    ["0001", false],
    ["0010", true],
    ["0011", true],
    ["0100", true],
    ["0101", true],
    ["0110", true],
    ["0111", true],
    ["1000", true],
    ["1001", false],
    ["1010", true],
    ["1011", true],
    ["1100", true],
    ["1101", true],
    ["1110", true],
    ["1111", true],

    ["00000", true],
    ["00001", true],
    ["00010", false],
    ["00011", false],
    ["00100", true],
    ["00101", true],
    ["00110", true],
    ["00111", true],
    ["01000", true],
    ["01001", false],
    ["01010", true],
    ["01011", true],
    ["01100", true],
    ["01101", true],
    ["01110", true],
    ["01111", true],
    ["10000", true],
    ["10001", true],
    ["10010", false],
    ["10011", false],
    ["10100", true],
    ["10101", true],
    ["10110", true],
    ["10111", true],
    ["11000", true],
    ["11001", false],
    ["11010", true],
    ["11011", true],
    ["11100", true],
    ["11101", true],
    ["11110", true],
    ["11111", true],
  ])("%s", (input, accepted) => {
    let context: ExecDFAContext = {
      inputs: [...input],
      consumed_inputs: [],
      states_stack: [dfa.initial_state],
    };
    while (context.inputs.length !== 0) {
      const result = execDFA(dfa, context);
      if (!result.success) {
        expect(false).toBe(accepted);
        return;
      }
      context = result.value;
    }
    expect(true).toBe(accepted);
  });
});
