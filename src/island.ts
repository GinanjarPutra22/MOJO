import { invoke } from "@tauri-apps/api/core";

/** Ukuran jendela (piksel logis). Harus sama dengan ukuran pil di App.css. */
export const COLLAPSED = { width: 260, height: 44 };
export const EXPANDED = { width: 420, height: 200 };

/** Lama transisi CSS (ms). Harus sama dengan --anim di App.css. */
export const ANIM_MS = 320;

export function resizeIsland(size: { width: number; height: number }) {
  return invoke("resize_island", size);
}
