import { MapValue } from "../utils/MapUtil";
import { Result, error, ok } from "../utils/Result";
import { getFreshSeparator } from "../utils/separator";

export type AutomatonInput = string;
export type AutomatonState = string;

export const automaton_epsilon_input: AutomatonInput = "ε";

// NFA: 非決定性有限オートマトン
export type NFA = {
  initial_state: AutomatonState;
  transitions: Map<AutomatonState, Map<AutomatonInput, Set<AutomatonState>>>;
  accepting_states: Set<AutomatonState>;
};

export const addNFATransition = (
  transitions: NFA["transitions"],
  state: AutomatonState,
  input: AutomatonInput,
  next_state: AutomatonState
): void => {
  if (!transitions.has(state)) transitions.set(state, new Map());
  const input_to_states = transitions.get(state) as MapValue<
    typeof transitions
  >;

  if (!input_to_states.has(input)) input_to_states.set(input, new Set());
  const next_states = input_to_states.get(input) as MapValue<
    typeof input_to_states
  >;

  next_states.add(next_state);
};

// DFA: 決定性有限オートマトン
export type DFA = {
  initial_state: AutomatonState;
  transitions: Map<AutomatonState, Map<AutomatonInput, AutomatonState>>;
  accepting_states: Set<AutomatonState>;
};

export const addDFATransition = (
  transitions: DFA["transitions"],
  state: AutomatonState,
  input: AutomatonInput,
  next_state: AutomatonState
): void => {
  if (!transitions.has(state)) transitions.set(state, new Map());
  const input_to_state = transitions.get(state) as MapValue<typeof transitions>;

  input_to_state.set(input, next_state);
};

const getNFAEpsilonClosureStatesForSingleState = (
  state: AutomatonState,
  nfa: NFA,
  visited_states: Set<AutomatonState>
): Set<AutomatonState> => {
  const closure_states: Set<AutomatonState> = new Set([state]);

  const input_to_next_states = nfa.transitions.get(state);
  if (input_to_next_states === undefined) return closure_states;

  const next_states = input_to_next_states.get(automaton_epsilon_input);
  if (next_states === undefined) return closure_states;

  const new_visited_states = new Set(visited_states);
  new_visited_states.add(state);
  for (const next_state of next_states) {
    if (visited_states.has(next_state)) continue;

    const next_closure_states = getNFAEpsilonClosureStatesForSingleState(
      next_state,
      nfa,
      new_visited_states
    );
    for (const state of next_closure_states) {
      closure_states.add(state);
    }
  }

  return closure_states;
};
const getNFAEpsilonClosureStates = (
  states: Set<AutomatonState>,
  nfa: NFA
): Set<AutomatonState> => {
  const closure_states: Set<AutomatonState> = new Set();

  for (const state of states) {
    const closure_states_for_single_state =
      getNFAEpsilonClosureStatesForSingleState(state, nfa, new Set());
    for (const state of closure_states_for_single_state)
      closure_states.add(state);
  }

  return closure_states;
};

const getInputsFromNFAStates = (
  states: Set<AutomatonState>,
  nfa: NFA
): Set<AutomatonInput> => {
  const inputs: Set<AutomatonInput> = new Set();

  for (const state of states) {
    const input_to_next_states = nfa.transitions.get(state);
    if (input_to_next_states === undefined) continue;

    for (const input of input_to_next_states.keys())
      if (input !== automaton_epsilon_input) inputs.add(input);
  }

  return inputs;
};

const getDFAStateFromNFAStates = (() => {
  const separator = getFreshSeparator();
  return (states: Set<AutomatonState>): AutomatonState => {
    return Array.from(states)
      .sort((x, y) => x.localeCompare(y))
      .join(separator);
  };
})();

const intersectionSet = <T>(s1: Set<T>, s2: Set<T>): Set<T> => {
  const intersection: Set<T> = new Set();

  for (const s1_value of s1) {
    if (s2.has(s1_value)) intersection.add(s1_value);
  }

  return intersection;
};

// DFA constructed from NFA by powerset construction
// see: https://ja.wikipedia.org/wiki/%E9%83%A8%E5%88%86%E9%9B%86%E5%90%88%E6%A7%8B%E6%88%90%E6%B3%95
export type ConstructedDFA = DFA & {
  state_to_original_states: Map<AutomatonState, Set<AutomatonState>>;
};
export const constructDFAFromNFA = (nfa: NFA): ConstructedDFA => {
  const dfa_transitions: ConstructedDFA["transitions"] = new Map();
  const dfa_accepting_states: ConstructedDFA["accepting_states"] = new Set();
  const state_to_original_states: ConstructedDFA["state_to_original_states"] =
    new Map();

  const processed_dfa_states: Set<AutomatonState> = new Set();
  const processing_nfa_states_array: Set<AutomatonState>[] = [
    getNFAEpsilonClosureStates(new Set([nfa.initial_state]), nfa),
  ];
  while (processing_nfa_states_array.length !== 0) {
    const nfa_states =
      processing_nfa_states_array.shift() as (typeof processing_nfa_states_array)[number];
    if (processed_dfa_states.has(getDFAStateFromNFAStates(nfa_states)))
      continue;

    // construct transition function
    const inputs = getInputsFromNFAStates(nfa_states, nfa);
    for (const input of inputs) {
      // δ'(R,α) = U[r ∈ R](δ(r,α))
      const all_next_nfa_states: Set<AutomatonState> = new Set();
      for (const nfa_state of nfa_states) {
        const input_to_next_nfa_states = nfa.transitions.get(nfa_state);
        if (input_to_next_nfa_states === undefined) continue;

        const next_nfa_states = input_to_next_nfa_states.get(input);
        if (next_nfa_states === undefined) continue;

        const epsilon_closure_for_next_nfa_states = getNFAEpsilonClosureStates(
          next_nfa_states,
          nfa
        );
        for (const state of epsilon_closure_for_next_nfa_states)
          all_next_nfa_states.add(state);
      }

      const dfa_state = getDFAStateFromNFAStates(nfa_states);
      addDFATransition(
        dfa_transitions,
        dfa_state,
        input,
        getDFAStateFromNFAStates(all_next_nfa_states)
      );
      processing_nfa_states_array.push(all_next_nfa_states);
    }

    // construct accepting set
    // F' = {R ∈ P(Q) | R ∩ A ≠ ∅}
    if (intersectionSet(nfa_states, nfa.accepting_states).size !== 0)
      dfa_accepting_states.add(getDFAStateFromNFAStates(nfa_states));

    // construct state_to_original_states map
    state_to_original_states.set(
      getDFAStateFromNFAStates(nfa_states),
      nfa_states
    );

    processed_dfa_states.add(getDFAStateFromNFAStates(nfa_states));
  }

  return {
    initial_state: getDFAStateFromNFAStates(
      getNFAEpsilonClosureStates(new Set([nfa.initial_state]), nfa)
    ),
    transitions: dfa_transitions,
    accepting_states: dfa_accepting_states,
    state_to_original_states,
  };
};

export type ExecDFAContext = {
  inputs: AutomatonState[];
  consumed_inputs: AutomatonInput[];
  states_stack: AutomatonState[];
};
export const execDFA = (
  dfa: DFA,
  initial_context: ExecDFAContext
): Result<ExecDFAContext> => {
  const context: ExecDFAContext = {
    inputs: initial_context.inputs.concat(),
    consumed_inputs: initial_context.consumed_inputs.concat(),
    states_stack: initial_context.states_stack.concat(),
  };

  while (true) {
    if (context.states_stack.length === 0)
      return error({ ...context, msg: "execDFA: length of states_stack is 0" });

    if (context.inputs.length === 0)
      return error({ ...context, msg: "execDFA: no inputs" });

    const state = context.states_stack[context.states_stack.length - 1];
    const input_to_next_state = dfa.transitions.get(state);
    if (input_to_next_state === undefined)
      return error({
        ...context,
        msg: "execDFA: no transition for the current state",
      });

    const input = context.inputs[0];
    const next_state = input_to_next_state.get(input);
    if (next_state === undefined)
      return error({
        ...context,
        msg: "execDFA: no transition for the current input",
      });

    context.states_stack.push(next_state);
    context.inputs.shift();
    context.consumed_inputs.push(input);

    if (dfa.accepting_states.has(next_state)) break;
  }

  return ok(context);
};
