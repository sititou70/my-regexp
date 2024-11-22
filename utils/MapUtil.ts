export type MapValue<M extends Map<unknown, unknown>> =
  M extends Map<unknown, infer V> ? V : never;
