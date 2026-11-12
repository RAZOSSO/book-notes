import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useLibrary } from "../store/LibraryContext";
import { STATUS_LABEL, STATUS_ORDER, type BookStatus } from "../types";
import { RatingInput } from "../components/RatingInput";
import { CardForm } from "../components/CardForm";
import { CardItem } from "../components/CardItem";
import { FinishSummaryEditor } from "../components/FinishSummaryEditor";
import { MemoList } from "../components/MemoList";
import { ActionItemList } from "../components/ActionItemList";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ExportModal } from "../components/ExportModal";
import { AiSummaryModal } from "../components/AiSummaryModal";
import { progressRatio } from "../utils/selectors";
import { exportBookToMarkdown } from "../utils/markdown";

type CardSort = "new" | "old" | "page";

export function BookDetailPage() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightCardId = searchParams.get("card");
  const {
    data,
    updateBook,
    deleteBook,
    setBookStatus,
    addCard,
    updateCard,
    deleteCard,
    saveFinishSummary,
    addMemo,
    updateMemoText,
    deleteMemo,
    saveAiSummary,
    deleteAiSummary,
    addActionItem,
    toggleActionItem,
    deleteActionItem,
  } = useLibrary();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showAiSummary, setShowAiSummary] = useState(false);
  const [cardSort, setCardSort] = useState<CardSort>("new");

  const book = data.books.find((b) => b.id === bookId);
  const cards = useMemo(
    () => data.cards.filter((c) => c.bookId === bookId),
    [data.cards, bookId],
  );
  const summary = data.finishSummaries.find((f) => f.bookId === bookId);
  const aiSummary = data.aiSummaries.find((s) => s.bookId === bookId);
  const memos = useMemo(
    () => data.memos.filter((m) => m.bookId === bookId),
    [data.memos, bookId],
  );
  const actionItems = useMemo(
    () => data.actionItems.filter((a) => a.bookId === bookId),
    [data.actionItems, bookId],
  );

  const sortedCards = useMemo(() => {
    const sorted = [...cards];
    if (cardSort === "new") {
      sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } else if (cardSort === "old") {
      sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    } else {
      sorted.sort((a, b) => (a.page ?? Infinity) - (b.page ?? Infinity));
    }
    return sorted;
  }, [cards, cardSort]);

  useEffect(() => {
    if (!highlightCardId) return;
    const el = document.getElementById(`card-${highlightCardId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightCardId, sortedCards]);

  if (!book) {
    return (
      <div className="page">
        <p>本が見つかりませんでした。</p>
        <Link to="/">棚に戻る</Link>
      </div>
    );
  }

  const ratio = progressRatio(book);

  return (
    <div className="page book-detail-page">
      <header className="page-header">
        <Link to="/" className="btn-link">
          ← 棚に戻る
        </Link>
        <div className="header-actions">
          <Link to="/search" className="btn">
            横断検索
          </Link>
          <Link to={`/books/${book.id}/edit`} className="btn">
            書誌を編集
          </Link>
          <button type="button" className="btn" onClick={() => setShowExport(true)}>
            この本を書き出す
          </button>
          <button type="button" className="btn btn-danger" onClick={() => setConfirmDelete(true)}>
            本を削除
          </button>
        </div>
      </header>

      <section className="book-info">
        <h1>{book.title}</h1>
        <p className="book-authors">{book.authors.join(", ") || "著者未設定"}</p>

        <div className="status-tabs">
          {STATUS_ORDER.map((s) => (
            <button
              key={s}
              type="button"
              className={book.status === s ? "tab active" : "tab"}
              onClick={() => setBookStatus(book.id, s as BookStatus)}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>

        <div className="progress-row">
          <label className="field field-small">
            <span>現在ページ</span>
            <input
              type="number"
              min={0}
              value={book.currentPage ?? ""}
              onChange={(e) =>
                updateBook(book.id, {
                  currentPage: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
          </label>
          <span className="page-sep">/</span>
          <span className="total-pages">{book.totalPages ?? "総ページ未設定"}</span>
          {ratio !== null && <span className="progress-text">{Math.round(ratio * 100)}%</span>}
        </div>

        <div className="rating-row">
          <span>評価</span>
          <RatingInput
            value={book.rating}
            onChange={(rating) => updateBook(book.id, { rating })}
          />
        </div>

        {book.status === "finished" && (
          <div className="finished-at-row field field-small">
            <span>読了日</span>
            <input
              type="date"
              value={book.finishedAt ?? ""}
              onChange={(e) => updateBook(book.id, { finishedAt: e.target.value })}
            />
          </div>
        )}
      </section>

      <section className="book-section">
        <div className="card-list-header">
          <h2>メモ（{memos.length}）</h2>
          <button
            type="button"
            className="btn"
            disabled={memos.length === 0}
            title={memos.length === 0 ? "先にメモを1件以上追加してください" : undefined}
            onClick={() => setShowAiSummary(true)}
          >
            AIでまとめる
          </button>
        </div>
        {aiSummary && (
          <div className="ai-summary">
            <div className="memo-item-header">
              <span>AI要約（{new Date(aiSummary.updatedAt).toLocaleString("ja-JP")}）</span>
              <button
                type="button"
                className="btn-link"
                onClick={() => deleteAiSummary(book.id)}
              >
                削除
              </button>
            </div>
            <p className="ai-summary-text">{aiSummary.text}</p>
          </div>
        )}
        <MemoList
          memos={memos}
          onAdd={(text) => addMemo(book.id, text)}
          onUpdate={updateMemoText}
          onDelete={deleteMemo}
          draftKey={`memo-add-${book.id}`}
        />
      </section>

      <section className="book-section">
        <h2>読了まとめ</h2>
        <FinishSummaryEditor
          summary={summary?.summary}
          onSave={(text) => saveFinishSummary(book.id, text)}
          draftKey={`summary-${book.id}`}
        />
      </section>

      <section className="book-section">
        <h2>次の行動</h2>
        <ActionItemList
          items={actionItems}
          onAdd={(text) => addActionItem(book.id, text)}
          onToggle={toggleActionItem}
          onDelete={deleteActionItem}
          draftKey={`action-add-${book.id}`}
        />
      </section>

      <section className="book-section card-add-section">
        <h2>カードを積む</h2>
        <CardForm
          allTags={data.tags}
          submitLabel="カードを追加"
          onSubmit={(values) => addCard(book.id, { ...values })}
          draftKey={`card-add-${book.id}`}
        />
      </section>

      <section className="book-section">
        <div className="card-list-header">
          <h2>カード（{cards.length}）</h2>
          <select value={cardSort} onChange={(e) => setCardSort(e.target.value as CardSort)}>
            <option value="new">新しい順</option>
            <option value="old">古い順</option>
            <option value="page">ページ順</option>
          </select>
        </div>
        {sortedCards.length === 0 ? (
          <p className="empty-state">まだカードがありません。</p>
        ) : (
          <ul className="card-list">
            {sortedCards.map((card) => (
              <CardItem
                key={card.id}
                id={`card-${card.id}`}
                highlighted={card.id === highlightCardId}
                card={card}
                tags={data.tags.filter((t) => card.tagIds.includes(t.id))}
                allTags={data.tags}
                onUpdate={(values) => updateCard(card.id, { ...values })}
                onDelete={() => deleteCard(card.id)}
              />
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={confirmDelete}
        title="本を削除しますか"
        message="この本に紐づくカード・まとめ・次の行動もすべて削除されます。この操作は取り消せません。"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          deleteBook(book.id);
          navigate("/");
        }}
      />

      {showExport && (
        <ExportModal
          title={`「${book.title}」の書き出し`}
          filename={`${book.title}.md`}
          markdown={exportBookToMarkdown(book, cards, summary, actionItems, data.tags, memos)}
          onClose={() => setShowExport(false)}
        />
      )}

      {showAiSummary && (
        <AiSummaryModal
          bookTitle={book.title}
          memoTexts={memos.map((m) => m.text)}
          onSave={(text) => saveAiSummary(book.id, text)}
          onClose={() => setShowAiSummary(false)}
        />
      )}
    </div>
  );
}
