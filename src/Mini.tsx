import { useEffect, useState, type ReactNode } from "react";
import { formatTime, useMinuteClock } from "./clock";
import { Clock, Note } from "./icons";
import { OVERLAY_ICONS } from "./OverlayView";
import { overlayStore } from "./overlay";
import { musicStore } from "./modules/music/store";
import { pomoLeft, pomoStore } from "./modules/pomo-store";
import { mmss } from "./modules/Pomodoro";

/** Apa yang ditampilkan island saat ciut, dan selebar apa. Mengikuti prototipe: pesan > timer > musik > jam. */
export interface MiniMeta {
  kind: "clock" | "flash" | "pomo" | "music";
  color: string;
  icon: ReactNode;
  flash?: string;
  playing: boolean;
  /** Lebar pil (px, sebelum skala font). */
  cw: number;
}

export function useMiniMeta(enabled: Record<string, boolean>): MiniMeta {
  const overlay = overlayStore.use();
  const pomo = pomoStore.use();
  const music = musicStore.use();
  const playing = !!enabled["music"] && music.has_session && music.playing;

  if (overlay) {
    const o = OVERLAY_ICONS[overlay.kind] ?? OVERLAY_ICONS.volume;
    return { kind: "flash", color: o.color, icon: o.icon, flash: overlay.text, playing, cw: overlay.text.length > 18 ? 290 : 236 };
  }
  if (enabled["pomodoro"] && pomo?.running) {
    return { kind: "pomo", color: pomo.mode === "focus" ? "#ff7a59" : "#30d158", icon: <Clock size={12} />, playing, cw: playing ? 196 : 156 };
  }
  if (playing) return { kind: "music", color: "#1ed760", icon: <Note size={12} />, playing, cw: 190 };
  return { kind: "clock", color: "", icon: null, playing, cw: 112 };
}

export default function Mini({ meta }: { meta: MiniMeta }) {
  const now = useMinuteClock();
  const pomo = pomoStore.use();
  const [, redraw] = useState(0);

  // Hitung mundur di pil: detak 1 detik hanya selama timer berjalan.
  const ticking = meta.kind === "pomo";
  useEffect(() => {
    if (!ticking) return;
    const id = setInterval(() => redraw((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [ticking]);

  const text =
    meta.kind === "flash" ? meta.flash : meta.kind === "pomo" && pomo ? mmss(pomoLeft(pomo)) : formatTime(now);

  return (
    <div className="mini">
      <span className="ml">
        {meta.icon && (
          <span className="dot" key={meta.kind + meta.color} style={{ background: meta.color }}>
            {meta.icon}
          </span>
        )}
      </span>
      <span className="mini-t">{text}</span>
      <span className="wave" aria-hidden="true">
        <i /><i /><i /><i />
      </span>
    </div>
  );
}
