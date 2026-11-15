import { AiModal } from "./AiModal";
import { summarizeMemos, type BookContext } from "../utils/ai";

export function AiSummaryModal({
  ctx,
  onSave,
  onClose,
}: {
  ctx: BookContext;
  onSave: (text: string) => void;
  onClose: () => void;
}) {
  return (
    <AiModal
      title="AIでまとめる"
      loadingText="要約を作成しています…"
      run={(apiKey) => summarizeMemos(apiKey, ctx)}
      onClose={onClose}
      actions={(result) => (
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            onSave(result);
            onClose();
          }}
        >
          読了まとめに追加
        </button>
      )}
    >
      {(result) => <textarea className="export-preview" readOnly value={result} rows={10} />}
    </AiModal>
  );
}
