import { invoke } from "@tauri-apps/api/core";

/** Ruang kosong (transparan) di sekeliling island untuk lengkung notch dan pantulan pegas animasi. */
const SLACK_X = 28;
const SLACK_BOTTOM = 24;
const DI_TOP = 10;

const OPEN_W = 640;
const OPEN_H = 244;
const CLOSED_H = 38;

/** Ukuran jendela (piksel logis) untuk keadaan tertentu. Harus selaras dengan App.css. */
export function dims(open: boolean, cw: number, fs: number, di: boolean) {
  const w = (open ? OPEN_W : cw) * fs;
  const h = (open ? OPEN_H : CLOSED_H) * fs;
  return {
    width: Math.ceil(w + 2 * SLACK_X),
    height: Math.ceil(h + (di ? DI_TOP : 0) + SLACK_BOTTOM),
  };
}

export const resizeIsland = (size: { width: number; height: number }) => invoke("resize_island", size);
