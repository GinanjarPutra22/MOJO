import type { ComponentType } from "react";

export interface TabProps {
  /** true saat island terbuka dan tab ini sedang dipilih. Jangan jalankan timer saat false. */
  active: boolean;
}

export interface MojoModule {
  /** Harus sama dengan id di MODULE_DEFAULTS (src-tauri/src/store.rs). */
  id: string;
  name: string;
  description: string;
  /** Kalau ada, modul tampil sebagai tab di island yang terbuka. */
  tab?: { label: string; Component: ComponentType<TabProps> };
  /** Isi tambahan di island yang ciut: kiri dan kanan jam. */
  mini?: { Left?: ComponentType; Right?: ComponentType };
}
