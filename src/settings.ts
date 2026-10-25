import { invoke } from "@tauri-apps/api/core";
import { createStore } from "./store";

export interface Settings {
  /** id modul -> aktif atau tidak. Rust selalu mengisi semua id. */
  modules: Record<string, boolean>;
}

export const loadSettings = () => invoke<Settings>("get_settings");
export const saveSettings = (settings: Settings) => invoke<void>("save_settings", { settings });

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

/** Salinan status aktif/mati tiap modul, agar modul bisa tahu modul lain aktif (mis. Lirik). */
export const enabledStore = createStore<Record<string, boolean>>({});
