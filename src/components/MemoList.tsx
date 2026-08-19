import { type FormEvent } from "react";
import type { Memo } from "../types";
import { formatDateTime } from "../utils/selectors";
import { useDraft } from "../hooks/useDraft";

function MemoItem({
  memo,
  onUpdate,
  onDelete,
}: {
  memo: Memo;
  onUpdate: (text: string) => void;
  onDelete: () => void;
}) {
  const [text, setText, clearDraft] = useDraft(`memo-edit-${memo.id}`, memo.text);
  const dirty = text.trim() !== memo.text.trim();

  return (
    <li className="memo-item">
      <div className="memo-item-header">
        <span className="card-date">{formatDateTime(memo.createdAt)}</span>
        <button type="button" className="btn-link btn-link-danger" onClick={onDelete}>
          削除
        </button>
      </div>
      <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} />
      {dirty && (
        <div className="memo-item-actions">
          <button
            type="button"
            className="btn"
            onClick={() => {
              onUpdate(text);
              clearDraft(false);
            }}
          >
            保存
          </button>
        </div>
      )}
    </li>
  );
}

export function MemoList({
  memos,
  onAdd,
  onUpdate,
  onDelete,
  draftKey,
}: {
  memos: Memo[];
  onAdd: (text: string) => void;
  onUpdate: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  /** When set, the unsent "add memo" text survives navigation/reload. */
  draftKey?: string;
}) {
  const [draft, setDraft, clearDraft] = useDraft(draftKey ?? null, "");

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    clearDraft();
  };

  const sorted = [...memos].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="memo-list-wrap">
      <form className="memo-add-form" onSubmit={handleAdd}>
        <textarea
          rows={3}
          placeholder="思ったことを自由に書く（保存すると下に積み重なります）"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="memo-item-actions">
          <button type="submit" className="btn btn-primary">
            メモを追加
          </button>
        </div>
      </form>

      {sorted.length > 0 && (
        <ul className="memo-list">
          {sorted.map((memo) => (
            <MemoItem
              key={memo.id}
              memo={memo}
              onUpdate={(text) => onUpdate(memo.id, text)}
              onDelete={() => onDelete(memo.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
