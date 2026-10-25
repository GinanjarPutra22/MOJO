import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";
import { Pause, Play } from "../icons";
import type { TabProps } from "./types";

interface State {
  phase: "focus" | "break";
  running: boolean;
  remaining_ms: number;
  ends_at_ms: number;
}

const mmss = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

export default function Pomodoro({ active }: TabProps) {
  const [st, setSt] = useState<State | null>(null);
  const [, redraw] = useState(0);

  // Waktu dihitung di Rust. Di sini hanya menerima keadaan terbaru.
  useEffect(() => {
    invoke<State>("pomodoro_get").then(setSt);
    const un = listen<State>("pomodoro", (e) => setSt(e.payload));
    return () => {
      un.then((f) => f());
    };
  }, []);

  // Detak 1 detik hanya untuk menggambar ulang, dan hanya saat terlihat dan berjalan.
  const running = st?.running ?? false;
  useEffect(() => {
    if (!active || !running) return;
    const id = setInterval(() => redraw((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [active, running]);

  if (!st) return null;
  const act = (cmd: string) => invoke<State>(cmd).then(setSt);
  const ms = st.running ? st.ends_at_ms - Date.now() : st.remaining_ms;

  return (
    <div className="pomo">
      <div className="pomo-phase">{st.phase === "focus" ? "Fokus" : "Istirahat"}</div>
      <div className="pomo-time">{mmss(ms)}</div>
      <div className="pomo-actions">
        <button type="button" className="round" aria-label={st.running ? "Jeda" : "Mulai"} onClick={() => act(st.running ? "pomodoro_pause" : "pomodoro_start")}>
          {st.running ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <button type="button" className="pill" onClick={() => act("pomodoro_reset")}>
          Ulang
        </button>
        <button type="button" className="pill" onClick={() => act("pomodoro_skip")}>
          Lewati
        </button>
      </div>
    </div>
  );
}
