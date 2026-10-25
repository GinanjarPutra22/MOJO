import { invoke } from "@tauri-apps/api/core";
import { createStore } from "./store";

export type Pref = string | number | boolean;

export interface Settings {
  /** id modul -> aktif atau tidak. Rust selalu mengisi semua id. */
  modules: Record<string, boolean>;
  /** Preferensi lain: tampilan (ui.*). */
  prefs: Record<string, Pref>;
}

export const loadSettings = () => invoke<Settings>("get_settings");
export const saveSettings = (s: Partial<Settings>) =>
  invoke<void>("save_settings", { settings: { modules: {}, prefs: {}, ...s } });

/** Status aktif/mati tiap modul, agar modul bisa tahu modul lain aktif (mis. Lirik). */
export const enabledStore = createStore<Record<string, boolean>>({});

export const prefsStore = createStore<Record<string, Pref>>({});

const pending: Record<string, Pref> = {};
let timer: ReturnType<typeof setTimeout> | undefined;

/** Ubah preferensi: UI langsung berubah, penyimpanan ditunda sebentar (slider mengirim banyak nilai). */
export function setPref(key: string, value: Pref) {
  prefsStore.set((p) => ({ ...p, [key]: value }));
  pending[key] = value;
  clearTimeout(timer);
  timer = setTimeout(() => {
    const prefs = { ...pending };
    for (const k of Object.keys(pending)) delete pending[k];
    saveSettings({ prefs }).catch(() => {});
  }, 300);
}

export const num = (p: Record<string, Pref>, key: string, def: number) =>
  typeof p[key] === "number" ? (p[key] as number) : def;

/** Data bebas per fitur (mis. daftar to-do), disimpan sebagai JSON di folder config. */
export async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const text = await invoke<string | null>("read_data", { key });
    return text ? (JSON.parse(text) as T) : fallback;
  } catch {
    return fallback;
  }
}
export const writeJson = (key: string, value: unknown) =>
  invoke<void>("write_data", { key, value: JSON.stringify(value) });
