import { useEffect, useState } from "react";
import { pomoCmd, pomoLeft, pomoStore, type PomoMode } from "./pomo-store";
import type { TabProps } from "./types";

const LABEL: Record<PomoMode, string> = { focus: "Waktu fokus", short: "Istirahat singkat", long: "Istirahat panjang" };
const MODES: [PomoMode, string][] = [["focus", "Fokus"], ["short", "Istirahat"], ["long", "Istirahat panjang"]];
const CIRC = 326.7; // keliling lingkaran r=52

export const mmss = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

export default function Pomodoro({ active }: TabProps) {
  const st = pomoStore.use();
  const [, redraw] = useState(0);

  // Detak 1 detik hanya untuk menggambar ulang, dan hanya saat terlihat dan berjalan.
  const running = st?.running ?? false;
  useEffect(() => {
    if (!active || !running) return;
    const id = setInterval(() => redraw((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [active, running]);

  if (!st) return null;
  const left = pomoLeft(st);
  const color = st.mode === "focus" ? "#ff7a59" : "#30d158";
  let filled = st.sessions % 4;
  if (st.sessions > 0 && filled === 0 && st.mode !== "focus") filled = 4;

  return (
    <div className="pomo" style={{ ["--c" as string]: color }}>
      <div className="ringw">
        <svg viewBox="0 0 120 120">
          <circle className="rt" cx="60" cy="60" r="52" />
          <circle className="rp" cx="60" cy="60" r="52" style={{ strokeDashoffset: CIRC * (1 - left / st.total_ms) }} />
        </svg>
        <div className="rc">
          <div className="big">{mmss(left)}</div>
          <div className="sm">{LABEL[st.mode]}</div>
        </div>
      </div>
      <div className="pside">
        <div className="seg" role="group" aria-label="Mode timer">
          {MODES.map(([m, label]) => (
            <button key={m} type="button" className={st.mode === m ? "on" : ""} onClick={() => pomoCmd("pomodoro_mode", { mode: m })}>
              {label}
            </button>
          ))}
        </div>
        <div className="row">
          <button type="button" className="pill pri" onClick={() => pomoCmd(st.running ? "pomodoro_pause" : "pomodoro_start")}>
            {st.running ? "Jeda" : left < st.total_ms ? "Lanjut" : "Mulai"}
          </button>
          <button type="button" className="pill" onClick={() => pomoCmd("pomodoro_reset")}>Ulang</button>
          <button type="button" className="pill" onClick={() => pomoCmd("pomodoro_skip")}>Lewati</button>
        </div>
        <div>
          <div className="dots" role="img" aria-label="Sesi fokus">
            {[1, 2, 3, 4].map((k) => (
              <i key={k} className={filled >= k ? "f" : ""} />
            ))}
          </div>
          <div className="sm" style={{ marginTop: 6 }}>{st.sessions} sesi fokus selesai</div>
        </div>
      </div>
    </div>
  );
}
