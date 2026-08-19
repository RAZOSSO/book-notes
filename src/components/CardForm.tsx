import { useState, type FormEvent } from "react";
import type { Tag } from "../types";
import { useDraft } from "../hooks/useDraft";

export interface CardFormValues {
  quote: string;
  comment: string;
  page: string;
  tagsText: string;
}

const EMPTY: CardFormValues = { quote: "", comment: "", page: "", tagsText: "" };

export function CardForm({
  initial,
  allTags,
  submitLabel,
  onSubmit,
  onCancel,
  autoFocus,
  draftKey,
}: {
  initial?: CardFormValues;
  allTags: Tag[];
  submitLabel: string;
  onSubmit: (values: { quote: string; comment: string; page?: number; tagNames: string[] }) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
  /** When set, in-progress (unsaved) input survives navigation/reload. */
  draftKey?: string;
}) {
  const [values, setValues, clearDraft] = useDraft<CardFormValues>(
    draftKey ?? null,
    initial ?? EMPTY,
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const quote = values.quote.trim();
    const comment = values.comment.trim();
    if (!quote || !comment) {
      setError("引用と一言はどちらも必須です");
      return;
    }
    const page = values.page.trim() ? Number(values.page.trim()) : undefined;
    const tagNames = values.tagsText
      .split(/[,、]/)
      .map((t) => t.trim())
      .filter(Boolean);
    onSubmit({ quote, comment, page, tagNames });
    clearDraft();
    setError(null);
  };

  return (
    <form className="card-form" onSubmit={handleSubmit}>
      {error && <p className="form-error">{error}</p>}
      <label className="field">
        <span>引用（本文）</span>
        <textarea
          autoFocus={autoFocus}
          value={values.quote}
          onChange={(e) => setValues((v) => ({ ...v, quote: e.target.value }))}
          rows={3}
          placeholder="本文を引用する"
        />
      </label>
      <label className="field">
        <span>自分の一言</span>
        <textarea
          value={values.comment}
          onChange={(e) => setValues((v) => ({ ...v, comment: e.target.value }))}
          rows={2}
          placeholder="感想・考えたこと"
        />
      </label>
      <div className="field-row">
        <label className="field field-small">
          <span>ページ</span>
          <input
            type="number"
            min={0}
            value={values.page}
            onChange={(e) => setValues((v) => ({ ...v, page: e.target.value }))}
            placeholder="任意"
          />
        </label>
        <label className="field field-grow">
          <span>タグ（カンマ区切り）</span>
          <input
            type="text"
            list="tag-suggestions"
            value={values.tagsText}
            onChange={(e) => setValues((v) => ({ ...v, tagsText: e.target.value }))}
            placeholder="仕事, 人生"
          />
          <datalist id="tag-suggestions">
            {allTags.map((t) => (
              <option key={t.id} value={t.name} />
            ))}
          </datalist>
        </label>
      </div>
      <div className="modal-actions">
        {onCancel && (
          <button
            type="button"
            className="btn"
            onClick={() => {
              clearDraft();
              onCancel();
            }}
          >
            キャンセル
          </button>
        )}
        <button type="submit" className="btn btn-primary">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
