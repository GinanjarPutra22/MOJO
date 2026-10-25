import { invoke } from "@tauri-apps/api/core";

export interface Settings {
  /** id modul -> aktif atau tidak. Modul yang belum tercatat memakai nilai bawaannya. */
  modules: Record<string, boolean>;
}

export function loadSettings(): Promise<Settings> {
  return invoke<Settings>("get_settings");
}

export function saveSettings(settings: Settings): Promise<void> {
  return invoke("save_settings", { settings });
}
