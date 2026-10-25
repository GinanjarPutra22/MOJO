import Clock from "./Clock";
import FocusTimer from "./FocusTimer";
import type { MojoModule } from "./types";

/**
 * Daftar semua modul. Untuk menambah fitur baru: buat komponennya,
 * lalu daftarkan di sini. Settings akan otomatis menampilkan saklarnya.
 */
export const MODULES: MojoModule[] = [
  {
    id: "clock",
    name: "Jam",
    description: "Menampilkan jam saat island terbuka.",
    defaultEnabled: true,
    Component: Clock,
  },
  {
    id: "focus-timer",
    name: "Timer fokus",
    description: "Hitung mundur 25 menit untuk sesi fokus.",
    defaultEnabled: false,
    Component: FocusTimer,
  },
];
