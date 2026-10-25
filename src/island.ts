import { invoke } from "@tauri-apps/api/core";

/** Ukuran jendela (piksel logis). Harus sama dengan ukuran island di App.css. */
export const COLLAPSED = { width: 340, height: 40 };
export const EXPANDED = { width: 600, height: 172 };

/** Lama transisi CSS (ms). Harus sama dengan --anim di App.css. */
export const ANIM_MS = 320;

export function resizeIsland(size: { width: number; height: number }) {
  return invoke("resize_island", size);
}
