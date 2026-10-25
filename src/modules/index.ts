import Music from "./music/Music";
import Pomodoro from "./Pomodoro";
import Todo from "./Todo";
import type { MojoModule } from "./types";

/**
 * Daftar semua modul. Untuk menambah fitur baru: buat komponennya, daftarkan
 * di sini, dan tambahkan id-nya di MODULE_DEFAULTS (Rust). Settings otomatis
 * menampilkan saklarnya.
 */
export const MODULES: MojoModule[] = [
  { id: "music", name: "Music", group: "feature", description: "Lagu yang sedang diputar dan kontrolnya.", tab: { label: "Music", Component: Music } },
  { id: "pomodoro", name: "Pomodoro", group: "feature", description: "Timer fokus dan istirahat (dihitung di Rust).", tab: { label: "Pomodoro", Component: Pomodoro } },
  { id: "todo", name: "To-Do", group: "feature", description: "Daftar tugas dengan prioritas dan tenggat.", tab: { label: "To-Do", Component: Todo } },

  { id: "lyrics", name: "Lirik", group: "system", description: "Lirik dari lrclib.net (judul dan artis dikirim ke sana)." },
  { id: "volume", name: "Overlay volume", group: "system", description: "Tampilkan volume saat berubah." },
  { id: "capslock", name: "Caps Lock", group: "system", description: "Overlay Caps Lock (memasang hook keyboard)." },
  { id: "battery", name: "Baterai", group: "system", description: "Pop-up charger dan baterai rendah." },
  { id: "wifi", name: "Wi-Fi", group: "system", description: "Pop-up saat jaringan terhubung/putus." },
  { id: "headphone", name: "Perangkat audio", group: "system", description: "Pop-up saat output suara berganti." },
];
