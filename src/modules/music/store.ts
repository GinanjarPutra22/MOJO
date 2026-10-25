import { listen } from "@tauri-apps/api/event";
import { createStore } from "../../store";

/** Keadaan musik dari Windows media session (dikirim Rust lewat event "music"). */
export interface MusicState {
  has_session: boolean;
  track_key: string;
  title: string;
  artist: string;
  album: string;
  playing: boolean;
  position_ms: number;
  duration_ms: number;
  /** Kapan position_ms dihitung (ms sejak 1970). */
  at_ms: number;
}

export type Music = MusicState & { thumb: string | null };

const empty: Music = {
  has_session: false, track_key: "", title: "", artist: "", album: "",
  playing: false, position_ms: 0, duration_ms: 0, at_ms: 0, thumb: null,
};

export const musicStore = createStore<Music>(empty);

/** Mulai mendengarkan event dari Rust. Dipanggil sekali dari App. */
export function listenMusic() {
  const un = listen<MusicState & { thumb?: string }>("music", (e) => {
    const p = e.payload;
    musicStore.set((prev) => ({
      ...p,
      // Sampul hanya dikirim saat berubah; simpan yang lama selama lagu sama.
      thumb: p.thumb ?? (p.track_key === prev.track_key ? prev.thumb : null),
    }));
  });
  return () => {
    un.then((f) => f());
  };
}

/** Posisi lagu sekarang (ms), diperkirakan dari data terakhir tanpa polling. */
export function positionNow(m: Music): number {
  const pos = m.playing ? m.position_ms + (Date.now() - m.at_ms) : m.position_ms;
  return m.duration_ms > 0 ? Math.min(pos, m.duration_ms) : pos;
}

/** true saat tampilan lirik di tab Music terbuka (App memakainya untuk menyembunyikan tanggal). */
export const lyricsViewStore = createStore<boolean>(false);
