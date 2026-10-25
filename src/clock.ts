import { useEffect, useState } from "react";

/** Waktu sekarang, diperbarui sekali per menit (bukan tiap detik) agar CPU tetap idle. */
export function useMinuteClock(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let id: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const d = new Date();
      id = setTimeout(
        () => {
          setNow(new Date());
          schedule();
        },
        60_000 - (d.getSeconds() * 1000 + d.getMilliseconds()) + 50,
      );
    };
    schedule();
    return () => clearTimeout(id);
  }, []);
  return now;
}

export const formatTime = (d: Date) =>
  d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }).replace(".", ":");

export const formatDate = (d: Date) =>
  d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
