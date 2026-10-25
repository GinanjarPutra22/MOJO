import type { ReactNode } from "react";
import { Battery, Bolt, Caps, Headphones, Mute, Timer, Volume, Wifi } from "./icons";
import type { Overlay } from "./overlay";

const ICONS: Record<string, ReactNode> = {
  volume: <Volume size={16} />,
  mute: <Mute size={16} />,
  caps: <Caps size={16} />,
  battery: <Battery size={16} />,
  charging: <Bolt size={16} />,
  wifi: <Wifi size={16} />,
  audio: <Headphones size={16} />,
  pomodoro: <Timer size={16} />,
};

/** Isi pesan singkat: ikon, teks, dan bilah bila ada nilainya (volume). */
export default function OverlayView({ overlay }: { overlay: Overlay }) {
  return (
    <span className="ov">
      {ICONS[overlay.kind]}
      <span className="ov-text">{overlay.text}</span>
      {overlay.value !== undefined && (
        <span className="ov-bar">
          <span style={{ width: `${overlay.value}%` }} />
        </span>
      )}
    </span>
  );
}
