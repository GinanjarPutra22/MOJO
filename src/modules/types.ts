import type { ComponentType } from "react";

export interface ModuleProps {
  /** true saat island sedang terbuka. Modul tidak boleh menjalankan timer saat false kecuali memang perlu. */
  active: boolean;
}

export interface MojoModule {
  id: string;
  name: string;
  description: string;
  defaultEnabled: boolean;
  Component: ComponentType<ModuleProps>;
}
