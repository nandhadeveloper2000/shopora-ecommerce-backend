export function applySoftDeleteFilter<T extends Record<string, unknown>>(query: T = {} as T) {
  return {
    ...query,
    isDeleted: false,
  };
}