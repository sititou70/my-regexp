type ResultOk<V> = { success: true; value: V };
type ResultError<E> = { success: false; error: E };

export type Result<V, E = unknown> = ResultOk<V> | ResultError<E>;

export const ok = <V>(value: V): ResultOk<V> => ({ success: true, value });
export const error = <E>(error?: E): ResultError<E | undefined> => ({
  success: false,
  error,
});
