export interface Line {
  t: number; // ms
  text: string;
}

const cache = new Map<string, Line[] | null>();

function parseLrc(lrc: string): Line[] {
  const lines: Line[] = [];
  for (const raw of lrc.split("\n")) {
    const stamps = [...raw.matchAll(/\[(\d+):(\d+(?:\.\d+)?)\]/g)];
    const text = raw.replace(/\[[^\]]*\]/g, "").trim();
    for (const m of stamps) lines.push({ t: (Number(m[1]) * 60 + Number(m[2])) * 1000, text });
  }
  return lines.sort((a, b) => a.t - b.t);
}

/**
 * Ambil lirik bersinkron dari LRCLIB (layanan lirik terbuka). Hanya dipanggil saat modul Lirik aktif
 * dan tampilan lirik dibuka; judul dan artis lagu dikirim ke lrclib.net.
 */
export async function fetchLyrics(key: string, title: string, artist: string, album: string, durationMs: number) {
  if (cache.has(key)) return cache.get(key)!;
  const q = new URLSearchParams({ track_name: title, artist_name: artist });
  if (album) q.set("album_name", album);
  if (durationMs > 0) q.set("duration", String(Math.round(durationMs / 1000)));
  let result: Line[] | null = null;
  try {
    const res = await fetch(`https://lrclib.net/api/get?${q}`);
    if (res.ok) {
      const json = await res.json();
      if (typeof json.syncedLyrics === "string") result = parseLrc(json.syncedLyrics);
    } else if (res.status === 404) {
      result = null;
    } else {
      return null; // kegagalan sementara: jangan di-cache
    }
  } catch {
    return null;
  }
  cache.set(key, result && result.length ? result : null);
  return cache.get(key)!;
}

/** Indeks baris yang sedang dinyanyikan pada posisi `pos` (ms); -1 jika belum mulai. */
export function lineIndex(lines: Line[], pos: number): number {
  let lo = 0, hi = lines.length - 1, ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lines[mid].t <= pos) { ans = mid; lo = mid + 1; } else hi = mid - 1;
  }
  return ans;
}
