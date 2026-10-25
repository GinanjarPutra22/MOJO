import Music, { MiniLeft } from "./music/Music";
import MiniRight from "./music/MiniRight";
import Pomodoro from "./Pomodoro";
import Todo from "./Todo";
import type { MojoModule } from "./types";

/**
 * Daftar semua modul. Untuk menambah fitur baru: buat komponennya, daftarkan
 * di sini, dan tambahkan id-nya di MODULE_DEFAULTS (Rust). Settings otomatis
 * menampilkan saklarnya.
 */
export const MODULES: MojoModule[] = [
  { id: "clock", name: "Tanggal & jam", description: "Tanggal dan jam di bagian atas island." },
  {
    id: "music",
    name: "Musik",
    description: "Lagu yang sedang diputar (Spotify, browser, dll.) dan kontrolnya.",
    tab: { label: "Music", Component: Music },
    mini: { Left: MiniLeft, Right: MiniRight },
  },
  {
    id: "lyrics",
    name: "Lirik",
    description: "Lirik bersinkron dari lrclib.net. Judul dan artis lagu dikirim ke layanan itu.",
  },
  {
    id: "pomodoro",
    name: "Pomodoro",
    description: "Fokus 25 menit, istirahat 5 menit. Timer berjalan di Rust.",
    tab: { label: "Pomodoro", Component: Pomodoro },
  },
  {
    id: "todo",
    name: "To-do",
    description: "Daftar tugas sederhana yang tersimpan.",
    tab: { label: "To-do", Component: Todo },
  },
  {
    id: "volume",
    name: "Overlay volume",
    description: "Tampilkan volume sebentar saat berubah.",
  },
  {
    id: "capslock",
    name: "Overlay Caps Lock",
    description: "Tampilkan status Caps Lock. Memasang hook keyboard (hanya cek tombol Caps Lock).",
  },
  {
    id: "battery",
    name: "Baterai & charger",
    description: "Pop-up saat charger dicolok/dicabut dan saat baterai rendah (20%).",
  },
  {
    id: "wifi",
    name: "Wi-Fi",
    description: "Pop-up saat jaringan terhubung atau internet terputus.",
  },
  {
    id: "headphone",
    name: "Perangkat audio",
    description: "Pop-up saat output suara berganti (mis. headphone dicolok).",
  },
];
