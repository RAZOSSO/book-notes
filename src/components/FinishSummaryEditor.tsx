import { useDraft } from "../hooks/useDraft";

export function FinishSummaryEditor({
  summary,
  onSave,
  draftKey,
}: {
  summary: string | undefined;
  onSave: (summary: string) => void;
  /** When set, in-progress (unsaved) edits survive navigation/reload. */
  draftKey?: string;
}) {
  const [text, setText, clearDraft] = useDraft(draftKey ?? null, summary ?? "");
  const dirty = text.trim() !== (summary ?? "").trim();

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
