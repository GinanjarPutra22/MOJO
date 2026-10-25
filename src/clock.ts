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
    setNow(new Date());
    schedule();
    return () => clearTimeout(id);
  }, []);
  return now;
}

const pad = (n: number) => String(n).padStart(2, "0");
const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export const formatTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const formatDate = (d: Date) => `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
