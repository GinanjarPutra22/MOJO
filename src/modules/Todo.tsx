import { useEffect, useRef, useState } from "react";
import { Check, Close } from "../icons";
import { readJson, writeJson } from "../settings";
import type { TabProps } from "./types";

interface Item {
  id: number;
  text: string;
  done: boolean;
}

export default function Todo(_: TabProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [text, setText] = useState("");
  const loaded = useRef(false);

  useEffect(() => {
    readJson<Item[]>("todos", []).then((v) => {
      setItems(v);
      loaded.current = true;
    });
  }, []);

  // Simpan hanya saat daftar berubah oleh pengguna (bukan saat pertama dimuat).
  const update = (next: Item[]) => {
    setItems(next);
    if (loaded.current) writeJson("todos", next).catch(() => {});
  };

  const add = () => {
    const t = text.trim();
    if (!t) return;
    update([...items, { id: Date.now(), text: t, done: false }]);
    setText("");
  };

  return (
    <div className="todo">
      <form
        className="todo-add"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Tambah tugas…" maxLength={120} />
      </form>
      <ul className="todo-list">
        {items.length === 0 && <li className="muted">Belum ada tugas.</li>}
        {items.map((it) => (
          <li key={it.id} className={it.done ? "done" : ""}>
            <button
              type="button"
              className="check"
              aria-label="Selesai"
              onClick={() => update(items.map((x) => (x.id === it.id ? { ...x, done: !x.done } : x)))}
            >
              {it.done && <Check size={12} />}
            </button>
            <span>{it.text}</span>
            <button type="button" className="icon" aria-label="Hapus" onClick={() => update(items.filter((x) => x.id !== it.id))}>
              <Close size={12} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
