import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLibrary } from "../store/LibraryContext";
import type { Book, Card, Tag } from "../types";
import { ExportModal } from "../components/ExportModal";
import { exportCardsByTagToMarkdown } from "../utils/markdown";

interface CardHit {
  card: Card;
  book: Book;
  tags: Tag[];
}

export function SearchPage() {
  const { data } = useLibrary();
  const [keyword, setKeyword] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);

  const usedTags = useMemo(() => {
    const usedIds = new Set(data.cards.flatMap((c) => c.tagIds));
    return data.tags.filter((t) => usedIds.has(t.id));
  }, [data.cards, data.tags]);

  const bookById = useMemo(() => {
    const map = new Map<string, Book>();
    for (const b of data.books) map.set(b.id, b);
    return map;
  }, [data.books]);

  const tagById = useMemo(() => {
    const map = new Map<string, Tag>();
    for (const t of data.tags) map.set(t.id, t);
    return map;
  }, [data.tags]);

  const results = useMemo<CardHit[]>(() => {
    const q = keyword.trim().toLowerCase();
    const hasQuery = q.length > 0 || selectedTagId !== null;
    if (!hasQuery) return [];

    const hits: CardHit[] = [];
    for (const card of data.cards) {
      const book = bookById.get(card.bookId);
      if (!book) continue;
      if (selectedTagId && !card.tagIds.includes(selectedTagId)) continue;

      if (q) {
        const tagNames = card.tagIds
          .map((id) => tagById.get(id)?.name ?? "")
          .join(" ")
          .toLowerCase();
        const summary =
          data.finishSummaries.find((f) => f.bookId === book.id)?.summary ?? "";
        const memoText = data.memos
          .filter((m) => m.bookId === book.id)
          .map((m) => m.text)
          .join(" ");
        const haystack = [
          card.quote,
          card.comment,
          tagNames,
          book.title,
          book.authors.join(" "),
          summary,
          memoText,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) continue;
      }

      hits.push({
        card,
        book,
        tags: card.tagIds.map((id) => tagById.get(id)).filter((t): t is Tag => Boolean(t)),
      });
    }
    hits.sort((a, b) => b.card.createdAt.localeCompare(a.card.createdAt));
    return hits;
  }, [data.cards, data.finishSummaries, data.memos, keyword, selectedTagId, bookById, tagById]);

  const exportLabel = selectedTagId
    ? `タグ: ${tagById.get(selectedTagId)?.name ?? ""}`
    : `検索: ${keyword}`;

  return (
    <div className="page search-page">
      <header className="page-header">
        <Link to="/" className="btn-link">
          ← 棚に戻る
        </Link>
        <h1>横断検索</h1>
      </header>

      <input
        type="search"
        className="search-input search-input-large"
        placeholder="キーワード（引用・一言・メモ・まとめ・タイトル・著者・タグ）"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        autoFocus
      />

      {usedTags.length > 0 && (
        <div className="tag-list tag-filter-list">
          {usedTags.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`tag-chip ${selectedTagId === t.id ? "selected" : ""}`}
              onClick={() => setSelectedTagId((cur) => (cur === t.id ? null : t.id))}
            >
              #{t.name}
            </button>
          ))}
        </div>
      )}

      <div className="search-results-header">
        <span>{results.length}件ヒット</span>
        {results.length > 0 && (
          <button type="button" className="btn" onClick={() => setShowExport(true)}>
            この結果を書き出す
          </button>
        )}
      </div>

      {results.length === 0 ? (
        <p className="empty-state">
          {keyword || selectedTagId ? "該当するカードがありません。" : "キーワードまたはタグで検索してください。"}
        </p>
      ) : (
        <ul className="card-list search-result-list">
          {results.map(({ card, book, tags }) => (
            <li key={card.id} className="card-item search-result-item">
              <Link
                to={`/books/${book.id}?card=${card.id}`}
                className="search-result-book-link"
              >
                {book.title}
              </Link>
              <div className="card-item-header">
                <span className="card-page">{card.page ? `p.${card.page}` : ""}</span>
              </div>
              <blockquote className="card-quote">{card.quote}</blockquote>
              <p className="card-comment">{card.comment}</p>
              {tags.length > 0 && (
                <div className="tag-list">
                  {tags.map((t) => (
                    <span key={t.id} className="tag-chip">
                      #{t.name}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {showExport && (
        <ExportModal
          title="検索結果の書き出し"
          filename={`${exportLabel.replace(/[\\/:*?"<>|]/g, "_")}.md`}
          markdown={exportCardsByTagToMarkdown(
            exportLabel,
            results.map((r) => ({ card: r.card, book: r.book })),
            data.tags,
          )}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}
