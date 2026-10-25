import { useEffect, useState } from "react";
import type { ModuleProps } from "./types";

const FOCUS_SECONDS = 25 * 60;

const mmss = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export default function FocusTimer(_: ModuleProps) {
  // Waktu selesai disimpan sebagai cap waktu, jadi hitungan tetap benar
  // walau detak tertunda.
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [left, setLeft] = useState(FOCUS_SECONDS);

  // Detak 1 detik hanya ada selama timer berjalan.
  useEffect(() => {
    if (endsAt === null) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining === 0) setEndsAt(null);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  const running = endsAt !== null;
  const toggle = () => {
    if (running) {
      setEndsAt(null);
    } else {
      const start = left === 0 ? FOCUS_SECONDS : left;
      setLeft(start);
      setEndsAt(Date.now() + start * 1000);
    }
  };
  const reset = () => {
    setEndsAt(null);
    setLeft(FOCUS_SECONDS);
  };

  return (
    <div className="focus">
      <span className="focus-time">{mmss(left)}</span>
      <button type="button" className="btn" onClick={toggle}>
        {running ? "Jeda" : "Mulai"}
      </button>
      <button type="button" className="btn ghost" onClick={reset}>
        Ulang
      </button>
    </div>
  );
}
