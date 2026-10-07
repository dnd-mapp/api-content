/**
 * Treats an empty environment variable as unset. Zod's `default()` only covers a variable that is unset, so wrap the
 * schema of an optional variable in `z.preprocess(emptyAsUnset, ...)` to give an empty one the default as well.
 */
export function emptyAsUnset(value: unknown) {
    return value === '' ? undefined : value;
}
