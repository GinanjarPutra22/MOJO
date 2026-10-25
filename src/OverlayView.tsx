import type { ReactNode } from "react";
import { Battery, Bolt, Caps, Clock, Headphones, Mute, Volume, Wifi } from "./icons";
import type { Overlay } from "./overlay";

/** Ikon dan warna titik untuk tiap jenis pesan singkat. */
export const OVERLAY_ICONS: Record<string, { icon: ReactNode; color: string }> = {
  volume: { icon: <Volume size={12} />, color: "#fff" },
  mute: { icon: <Mute size={12} />, color: "#fff" },
  caps: { icon: <Caps size={12} />, color: "#fff" },
  battery: { icon: <Battery size={12} />, color: "#ffd60a" },
  charging: { icon: <Bolt size={12} />, color: "#30d158" },
  wifi: { icon: <Wifi size={12} />, color: "#64d2ff" },
  audio: { icon: <Headphones size={12} />, color: "#fff" },
  pomodoro: { icon: <Clock size={12} />, color: "#ff7a59" },
};

/** Isi pesan singkat di header island yang terbuka: teks, dan bilah bila ada nilainya (volume). */
export default function OverlayView({ overlay }: { overlay: Overlay }) {
  return (
    <span className="ov">
      <span>{overlay.text}</span>
      {overlay.value !== undefined && (
        <span className="ov-bar">
          <span style={{ width: `${overlay.value}%` }} />
        </span>
      )}
    </span>
  );
}
