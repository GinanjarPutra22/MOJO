import type { MojoModule } from "./types";

/**
 * Daftar semua modul. Untuk menambah fitur baru: buat komponennya, daftarkan
 * di sini, dan tambahkan id-nya di MODULE_DEFAULTS (Rust). Settings otomatis
 * menampilkan saklarnya.
 */
export const MODULES: MojoModule[] = [
  { id: "clock", name: "Tanggal & jam", description: "Tanggal dan jam di bagian atas island." },
];
