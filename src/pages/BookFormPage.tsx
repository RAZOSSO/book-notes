import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLibrary } from "../store/LibraryContext";
import { STATUS_LABEL, STATUS_ORDER, type BookStatus } from "../types";
import { useDraft } from "../hooks/useDraft";

interface BookFormValues {
  title: string;
  authors: string;
  totalPages: string;
  currentPage: string;
  status: BookStatus;
}

export function BookFormPage() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const { data, addBook, updateBook, setBookStatus } = useLibrary();
  const editing = Boolean(bookId);
  const existing = editing ? data.books.find((b) => b.id === bookId) : undefined;

  const draftKey = editing ? `book-edit-${bookId}` : "book-new";
  const initialValues: BookFormValues = {
    title: existing?.title ?? "",
    authors: existing?.authors.join(", ") ?? "",
    totalPages: existing?.totalPages ? String(existing.totalPages) : "",
    currentPage: existing?.currentPage ? String(existing.currentPage) : "",
    status: existing?.status ?? "tsundoku",
  };
  const [form, setForm, clearDraft] = useDraft<BookFormValues>(draftKey, initialValues);
  const [error, setError] = useState<string | null>(null);

  if (editing && !existing) {
    return (
      <div className="page">
        <p>本が見つかりませんでした。</p>
      </div>
    );
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("タイトルは必須です");
      return;
    }
    const parsedTotal = form.totalPages.trim() ? Number(form.totalPages.trim()) : undefined;
    const parsedCurrent = form.currentPage.trim() ? Number(form.currentPage.trim()) : undefined;
    const authorList = form.authors
      .split(/[,、]/)
      .map((a) => a.trim())
      .filter(Boolean);

    if (editing && existing) {
      updateBook(existing.id, {
        title: form.title.trim(),
        authors: authorList,
        totalPages: parsedTotal,
        currentPage: parsedCurrent,
      });
      if (form.status !== existing.status) {
        setBookStatus(existing.id, form.status);
      }
      clearDraft();
      navigate(`/books/${existing.id}`);
    } else {
      const book = addBook({
        title: form.title.trim(),
        authors: authorList,
        totalPages: parsedTotal,
        currentPage: parsedCurrent,
        status: form.status,
      });
      clearDraft();
      navigate(`/books/${book.id}`);
    }
  };

  return (
    <div className="page book-form-page">
      <header className="page-header">
        <h1>{editing ? "本を編集" : "本を追加"}</h1>
      </header>
      <form className="book-form" onSubmit={handleSubmit}>
        {error && <p className="form-error">{error}</p>}
        <label className="field">
          <span>タイトル（必須）</span>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))}
            autoFocus
          />
        </label>
        <label className="field">
          <span>著者（カンマ区切り）</span>
          <input
            type="text"
            value={form.authors}
            onChange={(e) => setForm((v) => ({ ...v, authors: e.target.value }))}
          />
        </label>
        <div className="field-row">
          <label className="field field-small">
            <span>総ページ</span>
            <input
              type="number"
              min={0}
              value={form.totalPages}
              onChange={(e) => setForm((v) => ({ ...v, totalPages: e.target.value }))}
            />
          </label>
          <label className="field field-small">
            <span>現在ページ</span>
            <input
              type="number"
              min={0}
              value={form.currentPage}
              onChange={(e) => setForm((v) => ({ ...v, currentPage: e.target.value }))}
            />
          </label>
        </div>
        <label className="field">
          <span>状態</span>
          <select
            value={form.status}
            onChange={(e) => setForm((v) => ({ ...v, status: e.target.value as BookStatus }))}
          >
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <div className="modal-actions">
          <button
            type="button"
            className="btn"
            onClick={() => {
              clearDraft();
              navigate(-1);
            }}
          >
            キャンセル
          </button>
          <button type="submit" className="btn btn-primary">
            保存
          </button>
        </div>
      </form>
    </div>
  );
}
