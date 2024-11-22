import { MapValue } from "../utils/MapUtil";
import { Result, error, ok } from "../utils/Result";
import { getFreshSeparator } from "../utils/separator";
import {
  AutomatonState,
  ExecDFAContext,
  NFA,
  addNFATransition,
  automaton_epsilon_input,
  constructDFAFromNFA,
  execDFA,
} from "../automaton/automaton";
import { tokenize } from "./lexer/lexer";
import { Token } from "./lexer/types";
import { SYNTAX } from "./syntax";
import { AST, isAST } from "./types";

const getNFAState = (() => {
  const expression_separator = getFreshSeparator();
  const separator = getFreshSeparator();

  return (
    symbol: string,
    parsed_expression: string[],
    rest_expression: string[]
  ): AutomatonState => {
    return [
      symbol,
      parsed_expression.join(expression_separator),
      rest_expression.join(expression_separator),
    ].join(separator);
  };
})();

// see: https://www.jstage.jst.go.jp/article/jssst/31/1/31_1_30/_pdf
export const parse = (input: string): Result<AST> => {
  // lexical analysis
  const tokenize_result = tokenize(input);
  if (!tokenize_result.success) return tokenize_result;
  const tokens = tokenize_result.value;

  // construct NFA
  //// construct transition function
  const nfa_initial_state = "**NFA_START**";
  const nfa_transitions: NFA["transitions"] = new Map();
  const nonterminal_symbols: Set<string> = new Set(
    SYNTAX.rules.map((rule) => rule.symbol)
  );
  for (const rule of SYNTAX.rules) {
    for (let i = 0; i < rule.expression.length; i++) {
      const parsed_expression: string[] = rule.expression.slice(0, i);
      const rest_expression: string[] = rule.expression.slice(
        i,
        rule.expression.length
      );

      // δ(s,ε) = {[S → ·α] | S → α ∈ P}
      if (
        rule.symbol === SYNTAX.initial_symbol &&
        parsed_expression.length == 0
      )
        addNFATransition(
          nfa_transitions,
          nfa_initial_state,
          automaton_epsilon_input,
          getNFAState(rule.symbol, parsed_expression, rest_expression)
        );

      // δ([A → α·vβ],v) = {[A → αv·β]}
      const v = rest_expression[0];
      addNFATransition(
        nfa_transitions,
        getNFAState(rule.symbol, parsed_expression, rest_expression),
        v,
        getNFAState(
          rule.symbol,
          [...parsed_expression, v],
          rest_expression.slice(1, rest_expression.length)
        )
      );

      // δ([A → α·Bβ],ε) = {[B → ·γ | B → γ ∈ P]}
      const B = rest_expression[0];
      if (nonterminal_symbols.has(B)) {
        const state = getNFAState(
          rule.symbol,
          parsed_expression,
          rest_expression
        );

        for (const rule of SYNTAX.rules)
          if (B === rule.symbol)
            addNFATransition(
              nfa_transitions,
              state,
              automaton_epsilon_input,
              getNFAState(rule.symbol, [], rule.expression)
            );
      }
    }
  }

  //// constructs accepting status set
  //// F = {[A → α· | A → α ∈ P]}
  const nfa_accepting_states: NFA["accepting_states"] = new Set();
  const nfa_accepting_state_to_rule: Map<
    AutomatonState,
    (typeof SYNTAX)["rules"][number]
  > = new Map();
  for (const rule of SYNTAX.rules) {
    const state = getNFAState(rule.symbol, rule.expression, []);
    nfa_accepting_states.add(state);
    nfa_accepting_state_to_rule.set(state, rule);
  }

  const nfa: NFA = {
    initial_state: nfa_initial_state,
    transitions: nfa_transitions,
    accepting_states: nfa_accepting_states,
  };

  // construct DFA
  const dfa = constructDFAFromNFA(nfa);

  // exec dfa
  let context: ExecDFAContext = {
    inputs: tokens.map((token) => token.type),
    consumed_inputs: [],
    states_stack: [dfa.initial_state],
  };
  let symbols: (Token | AST)[] = tokens.concat();

  const getRuleFromNFAStates = (
    nfa_states: Set<AutomatonState>
  ): Result<MapValue<typeof nfa_accepting_state_to_rule>> => {
    for (const nfa_state of nfa_states) {
      const rule = nfa_accepting_state_to_rule.get(nfa_state);
      if (rule !== undefined) return ok(rule);
    }

    return error();
  };

  while (true) {
    const result = execDFA(dfa, context);
    if (!result.success)
      return error({ msg: "execDFA: dfa error", error: result.error, symbols });

    // get accepted rule
    const dfa_state =
      result.value.states_stack[result.value.states_stack.length - 1];
    const nfa_state = dfa.state_to_original_states.get(dfa_state);
    if (nfa_state === undefined)
      return error({
        msg: "execDFA: cannot get nfa_state from dfa_state",
        executed_context: result.value,
        symbols,
      });
    const get_rule_result = getRuleFromNFAStates(nfa_state);
    if (!get_rule_result.success)
      return error({
        msg: "execDFA: cannot get accepted rule from nfa_state",
        nfa_state,
        executed_context: result.value,
        symbols,
      });
    const rule = get_rule_result.value;

    // rule reduction
    const accepted_tokens_len = rule.expression.length;
    //// reduce context
    context = {
      inputs: [rule.symbol, ...result.value.inputs],
      consumed_inputs: result.value.consumed_inputs.slice(
        0,
        result.value.consumed_inputs.length - accepted_tokens_len
      ),
      states_stack: result.value.states_stack.slice(
        0,
        result.value.states_stack.length - accepted_tokens_len
      ),
    };

    //// reduce symbols
    const accepted_first_index = context.consumed_inputs.length;
    const accepted_last_index =
      accepted_first_index + (accepted_tokens_len - 1);
    const accepted_symbols = symbols.slice(
      accepted_first_index,
      accepted_last_index + 1
    );
    const callback_ast_result = rule.callback(accepted_symbols);
    if (!callback_ast_result.success)
      return error({
        msg: "execDFA: rule callback failed",
        rule,
        callback_argument: accepted_symbols,
        nfa_state,
        executed_context: result.value,
        symbols,
      });

    symbols = [
      ...symbols.slice(0, accepted_first_index),
      callback_ast_result.value,
      ...symbols.slice(accepted_last_index + 1, symbols.length),
    ];

    if (rule.symbol === SYNTAX.initial_symbol) break;
  }

  // final check
  if (symbols.length !== 1)
    return error({
      msg: "parse: unexpected error: length of symbols must be 1",
      symbols,
    });
  const ast = symbols[0];
  if (!isAST(ast))
    return error({
      msg: "parse: unexpected error: parsed result is not ast",
      symbols,
      ast,
    });

  return ok(ast);
};
