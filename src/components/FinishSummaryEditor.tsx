import { useEffect } from "react";
import { useDraft } from "../hooks/useDraft";

export interface AppendRequest {
  id: number;
  text: string;
}

export function FinishSummaryEditor({
  summary,
  onSave,
  draftKey,
  appendRequest,
}: {
  summary: string | undefined;
  onSave: (summary: string) => void;
  /** When set, in-progress (unsaved) edits survive navigation/reload. */
  draftKey?: string;
  /** Each new `id` appends `text` to what's in the editor and saves it. */
  appendRequest?: AppendRequest;
}) {
  const [text, setText, clearDraft] = useDraft(draftKey ?? null, summary ?? "");
  const dirty = text.trim() !== (summary ?? "").trim();

  useEffect(() => {
    if (!appendRequest) return;
    const next = text.trim()
      ? `${text.trimEnd()}\n\n${appendRequest.text}`
      : appendRequest.text;
    setText(next);
    onSave(next);
    clearDraft(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appendRequest?.id]);

  const lineCount = text.split("\n").filter((l) => l.trim()).length;

  return (
    <div className="finish-summary">
      <textarea
        rows={4}
        placeholder="3行程度で、この本から得たことをまとめる"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="finish-summary-footer">
        <span className="hint">{lineCount}行（目安3行）</span>
        <button
          type="button"
          className="btn"
          disabled={!dirty}
          onClick={() => {
            onSave(text);
            clearDraft(false);
          }}
        >
          まとめを保存
        </button>
      </div>
    </div>
  );
}
