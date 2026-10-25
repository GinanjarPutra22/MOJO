import { useEffect, useRef, useState } from "react";
import { Check, Cross, Pen } from "../icons";
import { readJson, writeJson } from "../settings";
import type { TabProps } from "./types";

interface Item {
  id: number;
  t: string;
  /** Prioritas 1 (tinggi) sampai 3 (rendah). */
  p: 1 | 2 | 3;
  d: string;
  x: boolean;
}

const PRIORITY = ["", "Tinggi", "Sedang", "Rendah"];
const DUE = ["Hari ini", "Besok", "Minggu ini", "Tanpa tenggat"];

/** Terima juga format lama ({text, done}) dari versi sebelumnya. */
function migrate(raw: unknown): Item[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((r: Record<string, unknown>, i) => ({
    id: Number(r.id ?? i),
    t: String(r.t ?? r.text ?? ""),
    p: ([1, 2, 3].includes(Number(r.p)) ? Number(r.p) : 2) as 1 | 2 | 3,
    d: typeof r.d === "string" ? r.d : "Tanpa tenggat",
    x: Boolean(r.x ?? r.done),
  }));
}

export default function Todo(_: TabProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const [prio, setPrio] = useState<1 | 2 | 3>(2);
  const [due, setDue] = useState(DUE[0]);
  const [editing, setEditing] = useState<number | null>(null);
  const loaded = useRef(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    readJson<unknown>("todos", []).then((v) => {
      setItems(migrate(v));
      loaded.current = true;
    });
  }, []);

  // Simpan hanya saat daftar berubah oleh pengguna (bukan saat pertama dimuat).
  const update = (next: Item[]) => {
    setItems(next);
    if (loaded.current) writeJson("todos", next).catch(() => {});
  };

  const save = () => {
    const t = text.trim();
    if (!t) return;
    update([{ id: Date.now(), t, p: prio, d: due, x: false }, ...items]);
    setText("");
    setAdding(false);
  };

  const done = items.filter((i) => i.x).length;

  return (
    <div className={`todo${adding ? " adding" : ""}`}>
      <div className="th">
        <div>
          <div className="tt">To-Do</div>
          <div className="sm">{done}/{items.length} tugas selesai</div>
        </div>
        <div className="bar"><b style={{ width: `${items.length ? (done / items.length) * 100 : 0}%`, ["--c" as string]: "#30d158" }} /></div>
        <button
          type="button"
          className="pill pri"
          onClick={() => {
            setAdding(!adding);
            if (!adding) setTimeout(() => input.current?.focus(), 120);
          }}
        >
          {adding ? "Batal" : "+ Tambah tugas"}
        </button>
      </div>
      <div className="tadd">
        <input
          ref={input}
          value={text}
          maxLength={60}
          placeholder="Apa yang perlu dikerjakan?"
          aria-label="Tugas baru"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") setAdding(false);
          }}
        />
        <button type="button" className="pill" aria-label="Ganti prioritas" onClick={() => setPrio((((prio % 3) + 1) as 1 | 2 | 3))}>
          <i className={`pr p${prio}`} />{PRIORITY[prio]}
        </button>
        <select value={due} aria-label="Tenggat" onChange={(e) => setDue(e.target.value)}>
          {DUE.map((d) => <option key={d}>{d}</option>)}
        </select>
        <button type="button" className="pill pri" onClick={save}>Simpan</button>
      </div>
      <ul className="tl">
        {items.length === 0 && <li className="sm">Belum ada tugas. Tekan Tambah tugas untuk mulai.</li>}
        {items.map((it) => (
          <li key={it.id} className={it.x ? "d" : ""}>
            <button type="button" className="ck" aria-label="Tandai selesai" onClick={() => update(items.map((x) => (x.id === it.id ? { ...x, x: !x.x } : x)))}>
              <Check />
            </button>
            <i className={`pr p${it.p}`} />
            {editing === it.id ? (
              <input
                autoFocus
                defaultValue={it.t}
                aria-label="Ubah tugas"
                maxLength={60}
                onFocus={(e) => e.currentTarget.select()}
                onBlur={(e) => {
                  const v = e.currentTarget.value.trim();
                  if (v) update(items.map((x) => (x.id === it.id ? { ...x, t: v } : x)));
                  setEditing(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                  if (e.key === "Escape") setEditing(null);
                }}
              />
            ) : (
              <span className="t">{it.t}</span>
            )}
            <span className="dl">{it.d === "Tanpa tenggat" ? "" : it.d}</span>
            <button type="button" className="ib" aria-label="Ubah tugas" onClick={() => setEditing(it.id)}><Pen size={14} /></button>
            <button type="button" className="ib" aria-label="Hapus tugas" onClick={() => update(items.filter((x) => x.id !== it.id))}><Cross size={14} /></button>
          </li>
        ))}
      </ul>
    </div>
  );
}
