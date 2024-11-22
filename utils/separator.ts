let count = 0;
export const getFreshSeparator = (): string => {
  count++;
  return "|".repeat(count);
};
