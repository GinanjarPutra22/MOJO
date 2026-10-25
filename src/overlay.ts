import { listen } from "@tauri-apps/api/event";
import { createStore } from "./store";

/** Pesan singkat dari Rust (volume, Caps Lock, baterai, Wi-Fi, dll.). */
export interface Overlay {
  kind: string;
  text: string;
  /** 0..100, untuk overlay yang punya bilah (volume). */
  value?: number;
  /** Berapa lama tampil (ms). Bawaan 2000. */
  ms?: number;
}

export const overlayStore = createStore<Overlay | null>(null);

let timer: ReturnType<typeof setTimeout> | undefined;

export function showOverlay(o: Overlay) {
  overlayStore.set(o);
  clearTimeout(timer);
  timer = setTimeout(() => overlayStore.set(null), o.ms ?? 2000);
}

export function listenOverlay() {
  const un = listen<Overlay>("overlay", (e) => showOverlay(e.payload));
  return () => {
    un.then((f) => f());
  };
}
