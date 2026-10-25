import { useEffect, useState } from "react";
import type { ModuleProps } from "./types";

const format = () =>
  new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

export default function Clock({ active }: ModuleProps) {
  const [text, setText] = useState(format);

  // Detak hanya berjalan saat island terbuka, jadi saat tertutup CPU idle.
  useEffect(() => {
    if (!active) return;
    setText(format());
    const id = setInterval(() => setText(format()), 1000);
    return () => clearInterval(id);
  }, [active]);

  return <div className="clock">{text}</div>;
}
