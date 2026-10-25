import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { Next, Note, Pause, Play, Prev, Quote, Volume } from "../../icons";
import { enabledStore } from "../../settings";
import type { TabProps } from "../types";
import { fetchLyrics, lineIndex, type Line } from "./lyrics";
import { musicStore, positionNow } from "./store";

const mmss = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

const control = (action: "toggle" | "next" | "prev") => invoke("music_control", { action });

export default function Music({ active }: TabProps) {
  const m = musicStore.use();
  const lyricsAllowed = enabledStore.use()["lyrics"] ?? false;
  const [lyricsOn, setLyricsOn] = useState(false);
  const [lines, setLines] = useState<Line[] | null | undefined>(undefined); // undefined = memuat
  const [, redraw] = useState(0);

  const showLyrics = lyricsOn && lyricsAllowed && m.has_session;

  // Muat lirik saat tampilan lirik dibuka atau lagu berganti.
  useEffect(() => {
    if (!showLyrics || !active) return;
    let cancelled = false;
    setLines(undefined);
    fetchLyrics(m.track_key, m.title, m.artist, m.album, m.duration_ms).then((l) => !cancelled && setLines(l));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLyrics, active, m.track_key]);

  // Bilah progres dan waktu: gambar ulang tiap detik, hanya saat terlihat dan lagu berjalan.
  useEffect(() => {
    if (!active || !m.playing) return;
    const id = setInterval(() => redraw((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [active, m.playing]);

  // Lirik: bangunkan tepat saat baris berikutnya dimulai (bukan polling).
  useEffect(() => {
    if (!showLyrics || !active || !m.playing || !lines) return;
    const pos = positionNow(m);
    const next = lines.find((l) => l.t > pos);
    if (!next) return;
    const id = setTimeout(() => redraw((n) => n + 1), Math.max(30, next.t - pos));
    return () => clearTimeout(id);
  });

  if (!m.has_session) {
    return (
      <div className="music-empty">
        <Note size={28} />
        <span>Putar musik di Spotify atau browser, lalu muncul di sini.</span>
      </div>
    );
  }

  const pos = positionNow(m);
  const pct = m.duration_ms > 0 ? (pos / m.duration_ms) * 100 : 0;
  const idx = lines ? lineIndex(lines, pos) : -1;

  const art = m.thumb ? <img className="art" src={m.thumb} alt="" /> : <div className="art ph"><Note size={28} /></div>;
  const progress = (
    <div className="prog">
      <span>{mmss(pos)}</span>
      <div className="prog-bar"><span style={{ width: `${pct}%` }} /></div>
      <span>{m.duration_ms > 0 ? `-${mmss(m.duration_ms - pos)}` : "--:--"}</span>
    </div>
  );
  const controls = (
    <div className="ctrl">
      <button type="button" className="icon" aria-label="Lirik" disabled={!lyricsAllowed}
        style={{ opacity: lyricsAllowed ? 1 : 0.3 }} onClick={() => setLyricsOn(!lyricsOn)}>
        <Quote size={18} />
      </button>
      <div className="ctrl-main">
        <button type="button" className="icon" aria-label="Sebelumnya" onClick={() => control("prev")}><Prev size={20} /></button>
        <button type="button" className="icon big" aria-label={m.playing ? "Jeda" : "Putar"} onClick={() => control("toggle")}>
          {m.playing ? <Pause size={26} /> : <Play size={26} />}
        </button>
        <button type="button" className="icon" aria-label="Berikutnya" onClick={() => control("next")}><Next size={20} /></button>
      </div>
      <span className="vol" aria-hidden="true"><Volume size={18} /></span>
    </div>
  );

  if (showLyrics) {
    const shown = lines ? lines.slice(Math.max(idx, 0), Math.max(idx, 0) + 3) : [];
    return (
      <div className="music lyr">
        <div className="music-left">
          <div className="head">
            {art}
            <div className="meta">
              <div className="title">{m.title}</div>
              <div className="artist">{m.artist}</div>
            </div>
          </div>
          {progress}
          {controls}
        </div>
        <div className="lyrics" key={idx}>
          {lines === undefined && <p className="l dim">Memuat lirik…</p>}
          {lines === null && <p className="l dim">Lirik tidak ditemukan.</p>}
          {shown.map((l, i) => (
            <p key={l.t + l.text} className={`l l${i}`}>{l.text || "♪"}</p>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="music">
      {art}
      <div className="music-right">
        <div className="title big">{m.title}</div>
        <div className="artist">{m.artist}</div>
        {progress}
        {controls}
      </div>
    </div>
  );
}

/** Isi island yang ciut: sampul kecil di kiri, ikon visualizer di kanan (hanya saat lagu berjalan). */
export function MiniLeft() {
  const m = musicStore.use();
  if (!m.has_session) return null;
  return m.thumb ? <img className="mini-art" src={m.thumb} alt="" /> : <Note size={18} />;
}
