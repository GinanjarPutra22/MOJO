import { Bars } from "../../icons";
import { musicStore } from "./store";

/** Ikon visualizer statis (tanpa animasi agar CPU idle tetap 0%). */
export default function MiniRight() {
  const m = musicStore.use();
  return m.has_session && m.playing ? <Bars size={18} /> : null;
}
