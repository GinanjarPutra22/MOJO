import { useSyncExternalStore } from "react";

/** Penyimpanan state kecil di luar React, supaya listener event Rust bisa menulis tanpa komponen. */
export function createStore<T>(initial: T) {
  let state = initial;
  const subs = new Set<() => void>();
  return {
    get: () => state,
    set(next: T | ((prev: T) => T)) {
      state = typeof next === "function" ? (next as (p: T) => T)(state) : next;
      subs.forEach((fn) => fn());
    },
    use: () =>
      useSyncExternalStore(
        (fn) => {
          subs.add(fn);
          return () => subs.delete(fn);
        },
        () => state,
      ),
  };
}
