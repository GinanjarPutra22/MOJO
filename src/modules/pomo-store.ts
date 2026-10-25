import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { createStore } from "../store";

export type PomoMode = "focus" | "short" | "long";

export interface PomoState {
  mode: PomoMode;
  running: boolean;
  remaining_ms: number;
  ends_at_ms: number;
  total_ms: number;
  sessions: number;
}

export const pomoStore = createStore<PomoState | null>(null);

/** Sisa waktu (ms). Saat berjalan dihitung dari waktu selesai, jadi tidak perlu polling ke Rust. */
export const pomoLeft = (s: PomoState) => (s.running ? Math.max(0, s.ends_at_ms - Date.now()) : s.remaining_ms);

export const refreshPomo = () => invoke<PomoState>("pomodoro_get").then(pomoStore.set);

export const pomoCmd = (cmd: string, args?: Record<string, unknown>) =>
  invoke<PomoState>(cmd, args).then(pomoStore.set);

export function listenPomo() {
  refreshPomo().catch(() => {});
  const un = listen<PomoState>("pomodoro", (e) => pomoStore.set(e.payload));
  return () => {
    un.then((f) => f());
  };
}
