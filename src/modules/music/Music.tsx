import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { Next, Note, Pause, Play, Prev, Quote, Volume } from "../../icons";
import { enabledStore } from "../../settings";
import type { TabProps } from "../types";
import { fetchLyrics, lineIndex, type Line } from "./lyrics";
import { lyricsViewStore, musicStore, positionNow } from "./store";

const mmss = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

const control = (action: "toggle" | "next" | "prev") => invoke("music_control", { action });
const LINE_H = 38;

export default function Music({ active }: TabProps) {
  const m = musicStore.use();
  const lyricsAllowed = enabledStore.use()["lyrics"] ?? false;
  const [lyricsOn, setLyricsOn] = useState(false);
  const [lines, setLines] = useState<Line[] | null | undefined>(undefined); // undefined = memuat
  const [, redraw] = useState(0);

  const showLyrics = lyricsOn && lyricsAllowed && m.has_session;
  useEffect(() => {
    lyricsViewStore.set(showLyrics);
    return () => lyricsViewStore.set(false);
  }, [showLyrics]);

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
  const idx = lines ? Math.max(0, lineIndex(lines, pos)) : 0;

  return (
    <div className={`player${showLyrics ? " lyr" : ""}`}>
      <div className="left">
        <div className="art">{m.thumb ? <img src={m.thumb} alt="" /> : <Note size={32} />}</div>
        <div className="meta">
          <p className="title">{m.title}</p>
          <p className="artist">{m.artist}</p>
        </div>
        <div className="prog">
          <span>{mmss(pos)}</span>
          <div className="bar"><b style={{ width: `${pct}%` }} /></div>
          <span>{m.duration_ms > 0 ? `-${mmss(m.duration_ms - pos)}` : "--:--"}</span>
        </div>
        <div className="ctrl">
          <span className="ic side v" aria-hidden="true"><Volume size={19} /></span>
          <div className="mid">
            <button type="button" className="ic" aria-label="Sebelumnya" onClick={() => control("prev")}><Prev size={19} /></button>
            <button type="button" className="ic play" aria-label={m.playing ? "Jeda" : "Putar"} onClick={() => control("toggle")}>
              {m.playing ? <Pause size={32} /> : <Play size={32} />}
            </button>
            <button type="button" className="ic" aria-label="Berikutnya" onClick={() => control("next")}><Next size={19} /></button>
          </div>
          <button
            type="button"
            className={`ic side q${showLyrics ? " on" : ""}`}
            aria-label="Tampilkan lirik"
            aria-pressed={showLyrics}
            disabled={!lyricsAllowed}
            style={{ opacity: lyricsAllowed ? 1 : 0.3 }}
            onClick={() => setLyricsOn(!lyricsOn)}
          >
            <Quote size={19} />
          </button>
        </div>
      </div>
      <div className="lyrics" aria-hidden={!showLyrics}>
        <div className="in" style={{ transform: `translateY(${-idx * LINE_H}px)` }}>
          {lines === undefined && <p className="now">Memuat lirik…</p>}
          {lines === null && <p className="now">Lirik tidak ditemukan.</p>}
          {lines?.map((l, i) => (
            <p key={i} className={i === idx ? "now" : ""}>{l.text || "♪"}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
