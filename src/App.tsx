import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { formatDate, formatTime, useMinuteClock } from "./clock";
import { Hex } from "./icons";
import { resizeIsland, dims } from "./island";
import Mini, { useMiniMeta } from "./Mini";
import { MODULES } from "./modules";
import { listenMusic, lyricsViewStore } from "./modules/music/store";
import { listenPomo, refreshPomo } from "./modules/pomo-store";
import { listenOverlay, overlayStore } from "./overlay";
import OverlayView from "./OverlayView";
import Settings from "./Settings";
import { enabledStore, loadSettings, num, prefsStore, saveSettings } from "./settings";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const OPEN_MS = 650; // transisi buka (pegas)
const CLOSE_MS = 560; // transisi tutup
const CW_MS = 520; // perubahan lebar pil saat ciut
const HOVER_CLOSE_MS = 350;

export default function App() {
  const enabled = enabledStore.use();
  const prefs = prefsStore.use();
  const overlay = overlayStore.use();
  const lyricsView = lyricsViewStore.use();
  const now = useMinuteClock();

  const fs = num(prefs, "ui.font", 100) / 100;
  const radius = num(prefs, "ui.radius", 34);
  const di = prefs["ui.style"] === "d";
  const pinned = prefs["ui.pinned"] === true;

  const meta = useMiniMeta(enabled);

  const [open, setOpen] = useState(false);
  const [cw, setCw] = useState(112);
  const [setsOpen, setSetsOpen] = useState(false);
  const [cur, setCur] = useState("music");

  // ---- jendela: ukuran jendela harus mendahului animasi buka dan menyusul animasi tutup ----
  const R = useRef({ want: false, open: false, cw: 112, wantCw: 112, fs: 1, di: false, busy: false });
  R.current.wantCw = meta.cw;
  R.current.fs = fs;
  R.current.di = di;

  const reconcile = useCallback(async () => {
    const r = R.current;
    if (r.busy) return;
    r.busy = true;
    try {
      for (;;) {
        if (r.want !== r.open) {
          if (r.want) {
            await resizeIsland(dims(true, r.cw, r.fs, r.di));
            r.open = true;
            setOpen(true);
            await wait(OPEN_MS);
          } else {
            r.open = false;
            setOpen(false);
            setSetsOpen(false);
            await wait(CLOSE_MS);
            await resizeIsland(dims(false, r.cw, r.fs, r.di));
          }
          continue;
        }
        if (!r.open && r.wantCw !== r.cw) {
          const next = r.wantCw;
          if (next > r.cw) {
            await resizeIsland(dims(false, next, r.fs, r.di));
            r.cw = next;
            setCw(next);
            await wait(CW_MS);
          } else {
            r.cw = next;
            setCw(next);
            await wait(CW_MS);
            await resizeIsland(dims(false, next, r.fs, r.di));
          }
          continue;
        }
        break;
      }
    } finally {
      r.busy = false;
    }
  }, []);

  useEffect(() => {
    reconcile();
  }, [meta.cw, reconcile]);

  // Ukuran font atau gaya berubah: sesuaikan jendela dengan keadaan sekarang.
  useEffect(() => {
    const r = R.current;
    resizeIsland(dims(r.open, r.cw, fs, di)).catch(() => {});
  }, [fs, di]);

  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const openIsland = useCallback(() => {
    clearTimeout(timer.current);
    R.current.want = true;
    reconcile();
  }, [reconcile]);
  const shut = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (prefsStore.get()["ui.pinned"] === true) return;
      const a = document.activeElement as HTMLElement | null;
      if (a?.matches("input,select")) return; // sedang mengetik
      a?.blur();
      R.current.want = false;
      reconcile();
    }, HOVER_CLOSE_MS);
  }, [reconcile]);

  // Tetap terbuka: buka saat dinyalakan, kembali ke perilaku hover saat dimatikan.
  useEffect(() => {
    if (pinned) openIsland();
    else shut();
  }, [pinned, openIsland, shut]);

  // ---- muat pengaturan dan pasang listener event dari Rust ----
  useEffect(() => {
    loadSettings()
      .then((s) => {
        enabledStore.set(s.modules);
        prefsStore.set(s.prefs ?? {});
      })
      .catch(() => {});
    const offs = [listenOverlay(), listenMusic(), listenPomo()];
    return () => offs.forEach((f) => f());
  }, []);

  const toggleModule = (id: string, value: boolean) => {
    enabledStore.set((m) => ({ ...m, [id]: value }));
    saveSettings({ modules: { [id]: value } })
      .then(() => {
        if (id === "pomodoro") refreshPomo().catch(() => {});
      })
      .catch(() => {});
  };

  // ---- tab ----
  const tabs = useMemo(() => MODULES.filter((m) => m.tab && enabled[m.id]), [enabled]);
  const curIdx = Math.max(0, tabs.findIndex((m) => m.id === cur));
  const current = tabs[curIdx];

  // pane yang sedang disiapkan di sisi luar sebelum meluncur masuk (tanpa transisi)
  const [prep, setPrep] = useState<{ id: string; side: "bef" | "aft" } | null>(null);
  const sides = useRef<Record<string, "bef" | "aft">>({});

  const go = useCallback(
    (id: string, dir: number) => {
      setSetsOpen(false);
      if (!current || id === current.id) return;
      setPrep({ id, side: dir > 0 ? "aft" : "bef" });
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          sides.current[current.id] = dir > 0 ? "bef" : "aft";
          setPrep(null);
          setCur(id);
        }),
      );
    },
    [current],
  );

  const step = useCallback(
    (dir: number) => {
      if (setsOpen || !R.current.open || tabs.length < 2) return;
      go(tabs[(curIdx + dir + tabs.length) % tabs.length].id, dir);
    },
    [setsOpen, tabs, curIdx, go],
  );

  // Fitur yang sedang dipilih dimatikan: pindah ke yang pertama.
  useEffect(() => {
    if (tabs.length && !tabs.some((m) => m.id === cur)) setCur(tabs[0].id);
  }, [tabs, cur]);

  // tiga tab terlihat: sebelumnya, sekarang, berikutnya
  const visible = tabs.length < 3 ? tabs.map((_, k) => k) : [(curIdx + tabs.length - 1) % tabs.length, curIdx, (curIdx + 1) % tabs.length];

  // geser: roda horizontal, tarik dengan mouse, dan panah keyboard
  const fullRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = fullRef.current;
    if (!el) return;
    let acc = 0;
    let lock = 0;
    let reset: ReturnType<typeof setTimeout>;
    const onWheel = (e: WheelEvent) => {
      if (setsOpen) return;
      const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
      if (!dx) return;
      e.preventDefault();
      const t = Date.now();
      if (t < lock) return;
      acc += dx;
      clearTimeout(reset);
      reset = setTimeout(() => (acc = 0), 150);
      if (Math.abs(acc) > 50) {
        step(acc > 0 ? 1 : -1);
        acc = 0;
        lock = t + 450;
      }
    };
    let sx: number | null = null;
    const onDown = (e: PointerEvent) => {
      sx = (e.target as HTMLElement).closest("button,input,select,.tl,.set") ? null : e.clientX;
    };
    const onUp = (e: PointerEvent) => {
      if (sx === null) return;
      const dx = e.clientX - sx;
      sx = null;
      if (Math.abs(dx) > 60) step(dx < 0 ? 1 : -1);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      clearTimeout(reset);
    };
  }, [step, setsOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).matches?.("input,select")) return;
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "Escape") {
        if (setsOpen) setSetsOpen(false);
        else if (!pinned) {
          R.current.want = false;
          reconcile();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, setsOpen, pinned, reconcile]);

  const paneClass = (id: string) => {
    if (prep?.id === id) return `view ${prep.side} noanim`;
    if (current?.id === id) return "view on";
    return `view ${sides.current[id] ?? "aft"}`;
  };

  const cls = ["island", open ? "open" : "", di ? "di" : "", meta.playing ? "playing" : "", lyricsView && current?.id === "music" ? "lyr" : ""];

  return (
    <div className="wrap">
      <div
        className={cls.filter(Boolean).join(" ")}
        style={{ ["--cw" as string]: `${cw}px`, ["--fs" as string]: fs, ["--r" as string]: `${radius}px` }}
        role="region"
        aria-label="MOJO"
        onPointerEnter={(e) => e.pointerType !== "touch" && openIsland()}
        onPointerLeave={(e) => e.pointerType !== "touch" && shut()}
        onClick={() => !open && openIsland()}
      >
        <div className="clip">
          <Mini meta={meta} />

          <div className="full" ref={fullRef} aria-hidden={!open}>
            <div className="head">
              <nav className="tabs" role="tablist" aria-label="Fitur">
                {visible.map((k, p) => (
                  <button
                    key={tabs[k].id}
                    type="button"
                    role="tab"
                    aria-selected={k === curIdx}
                    onClick={() => k !== curIdx && go(tabs[k].id, tabs.length < 3 ? (k > curIdx ? 1 : -1) : p === 0 ? -1 : 1)}
                  >
                    {tabs[k].tab!.label}
                  </button>
                ))}
              </nav>
              <div className="date">{overlay ? <OverlayView overlay={overlay} /> : `${formatDate(now)} | ${formatTime(now)}`}</div>
              <button type="button" className="ic settings" aria-label="Pengaturan" aria-pressed={setsOpen} onClick={() => open && setSetsOpen(!setsOpen)}>
                <Hex size={20} />
              </button>
            </div>

            {tabs.length === 0 && <p className="muted">Belum ada fitur aktif. Buka Pengaturan.</p>}
            {tabs.map((m) => {
              const Tab = m.tab!.Component;
              return (
                <section key={m.id} className={paneClass(m.id)} style={{ ["--c" as string]: undefined }}>
                  <Tab active={open && !setsOpen && current?.id === m.id} />
                </section>
              );
            })}

            <Settings open={setsOpen} enabled={enabled} prefs={prefs} onToggle={toggleModule} />
          </div>
        </div>
      </div>
    </div>
  );
}
