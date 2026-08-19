import { type FormEvent } from "react";
import type { ActionItem } from "../types";
import { useDraft } from "../hooks/useDraft";

export function ActionItemList({
  items,
  onAdd,
  onToggle,
  onDelete,
  draftKey,
}: {
  items: ActionItem[];
  onAdd: (text: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  /** When set, the unsent "add action item" text survives navigation/reload. */
  draftKey?: string;
}) {
  const [text, setText, clearDraft] = useDraft(draftKey ?? null, "");

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    clearDraft();
  };

  return (
    <div className="action-items">
      <ul className="action-item-list">
        {items.map((item) => (
          <li key={item.id} className={item.done ? "done" : ""}>
            <label>
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => onToggle(item.id)}
              />
              <span>{item.text}</span>
            </label>
            <button
              type="button"
              className="btn-link btn-link-danger"
              onClick={() => onDelete(item.id)}
            >
              削除
            </button>
          </li>
        ))}
        {items.length === 0 && <li className="hint">次の行動はまだありません</li>}
      </ul>
      <form className="action-item-add" onSubmit={handleAdd}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="次の行動を追加"
        />
        <button type="submit" className="btn">
          追加
        </button>
      </form>
    </div>
  );
}
