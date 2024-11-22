import {
  automaton_epsilon_input,
  AutomatonInput,
  AutomatonState,
  constructDFAFromNFA,
  execDFA,
  NFA,
} from "../automaton/automaton";
import { parse } from "../parser/parser";
import { AST } from "../parser/types";
import { error, ok, Result } from "../utils/Result";

let cnt = 0;
const getFreshState = () => {
  cnt++;
  return `st-${cnt}`;
};

const nfaChar = (char: string): NFA => {
  const initial_state = getFreshState();
  const accepting_state = getFreshState();

  return {
    initial_state,
    transitions: new Map([
      [initial_state, new Map([[char, new Set([accepting_state])]])],
    ]),
    accepting_states: new Set([accepting_state]),
  };
};

const addTransition = (
  transitions: NFA["transitions"],
  current_state: AutomatonState,
  input: AutomatonInput,
  next_states: Set<AutomatonState>
) => {
  const transition = transitions.get(current_state);
  if (transition === undefined) {
    transitions.set(current_state, new Map([[input, next_states]]));
    return;
  }

  const old_next_states = transition.get(input);
  if (old_next_states === undefined) {
    transition.set(input, next_states);
    return;
  }

  transition.set(input, new Set([...old_next_states, ...next_states]));
};

const nfaConcat = (nfa_left: NFA, nfa_right: NFA): NFA => {
  const initial_state = nfa_left.initial_state;
  const accepting_states = nfa_right.accepting_states;

  const transitions = new Map([
    ...nfa_left.transitions.entries(),
    ...nfa_right.transitions.entries(),
  ]);
  for (const accepting_state of nfa_left.accepting_states) {
    addTransition(
      transitions,
      accepting_state,
      automaton_epsilon_input,
      new Set([nfa_right.initial_state])
    );
  }

  return {
    initial_state,
    transitions,
    accepting_states,
  };
};

const nfaSelect = (nfa1: NFA, nfa2: NFA): NFA => {
  const initial_state = getFreshState();
  const accepting_states = new Set([
    ...nfa1.accepting_states,
    ...nfa2.accepting_states,
  ]);

  const transitions = new Map([
    ...nfa1.transitions.entries(),
    ...nfa2.transitions.entries(),
  ]);
  addTransition(
    transitions,
    initial_state,
    automaton_epsilon_input,
    new Set([nfa1.initial_state, nfa2.initial_state])
  );

  return {
    initial_state,
    transitions,
    accepting_states,
  };
};

const nfaStar = (nfa: NFA): NFA => {
  const initial_state = nfa.initial_state;
  const accepting_states = nfa.accepting_states;

  const transitions = new Map([...nfa.transitions.entries()]);
  for (const accepting_state of nfa.accepting_states) {
    addTransition(
      transitions,
      initial_state,
      automaton_epsilon_input,
      new Set([accepting_state])
    );
    addTransition(
      transitions,
      accepting_state,
      automaton_epsilon_input,
      new Set([initial_state])
    );
  }

  return {
    initial_state,
    transitions,
    accepting_states,
  };
};

const astToNFA = (ast: AST): NFA => {
  switch (ast.type) {
    case "Char": {
      return nfaChar(ast.value);
    }
    case "Concat": {
      const nfa_left = astToNFA(ast.ast_left);
      const nfa_right = astToNFA(ast.ast_right);
      return nfaConcat(nfa_left, nfa_right);
    }
    case "Select": {
      const nfa1 = astToNFA(ast.ast1);
      const nfa2 = astToNFA(ast.ast2);
      return nfaSelect(nfa1, nfa2);
    }
    case "Star": {
      const nfa = astToNFA(ast.ast);
      return nfaStar(nfa);
    }
  }
};

export const regexp = (pattern: string, input: string): Result<boolean> => {
  const parsed_result = parse(pattern);
  if (!parsed_result.success) return error("parse failed");

  const nfa = astToNFA(parsed_result.value);

  const dfa = constructDFAFromNFA(nfa);
  if (dfa.accepting_states.has(dfa.initial_state)) return ok(true);

  const result = execDFA(dfa, {
    inputs: input.split(""),
    consumed_inputs: [],
    states_stack: [dfa.initial_state],
  });

  return ok(result.success);
};
