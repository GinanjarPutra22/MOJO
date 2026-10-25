import type { ComponentType } from "react";

export interface TabProps {
  /** true saat island terbuka dan tab ini sedang terlihat. Jangan jalankan timer saat false. */
  active: boolean;
}

export interface MojoModule {
  /** Harus sama dengan id di MODULE_DEFAULTS (src-tauri/src/store.rs). */
  id: string;
  name: string;
  description: string;
  /** "feature": tampil sebagai tab. "system": layanan latar (overlay/pop-up), tanpa tab. */
  group: "feature" | "system";
  /** Kalau ada, modul tampil sebagai tab di island yang terbuka. */
  tab?: { label: string; Component: ComponentType<TabProps> };
}
