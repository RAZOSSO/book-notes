import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLibrary } from "../store/LibraryContext";
import { STATUS_LABEL, STATUS_ORDER, type Book, type BookStatus } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { RatingInput } from "../components/RatingInput";
import { isThisMonth, isThisYear, progressRatio } from "../utils/selectors";

type SortKey = "createdAt" | "updatedAt" | "title" | "finishedAt";
type FilterKey = "all" | BookStatus;

export function ShelfPage() {
  const { data } = useLibrary();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");

  const cardCountByBook = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of data.cards) {
      map.set(c.bookId, (map.get(c.bookId) ?? 0) + 1);
    }
    return map;
  }, [data.cards]);

  const finishedThisYear = useMemo(
    () => data.books.filter((b) => b.status === "finished" && isThisYear(b.finishedAt)).length,
    [data.books],
  );
  const finishedThisMonth = useMemo(
    () => data.books.filter((b) => b.status === "finished" && isThisMonth(b.finishedAt)).length,
    [data.books],
  );

  const visibleBooks = useMemo(() => {
    let books = data.books;
    if (filter !== "all") {
      books = books.filter((b) => b.status === filter);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      books = books.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.authors.some((a) => a.toLowerCase().includes(q)),
      );
    }
    const sorted = [...books].sort((a, b) => compare(a, b, sortKey));
    return sorted;
  }, [data.books, filter, query, sortKey]);

  return (
    <div className="page shelf-page">
      <header className="page-header">
        <h1>棚</h1>
        <div className="header-actions">
          <Link to="/settings" className="btn">
            設定
          </Link>
          <Link to="/search" className="btn">
            横断検索
          </Link>
          <Link to="/books/new" className="btn btn-primary">
            本を追加
          </Link>
        </div>
      </header>

      <div className="stats-row">
        <span>今年の読了: {finishedThisYear}冊</span>
        <span>今月の読了: {finishedThisMonth}冊</span>
        <span>登録数: {data.books.length}冊</span>
      </div>

      <div className="shelf-controls">
        <div className="status-tabs">
          <button
            type="button"
            className={filter === "all" ? "tab active" : "tab"}
            onClick={() => setFilter("all")}
          >
            すべて
          </button>
          {STATUS_ORDER.map((s) => (
            <button
              key={s}
              type="button"
              className={filter === s ? "tab active" : "tab"}
              onClick={() => setFilter(s)}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        <input
          type="search"
          className="search-input"
          placeholder="タイトル・著者で絞り込み"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
          <option value="updatedAt">更新日順</option>
          <option value="createdAt">追加日順</option>
          <option value="title">タイトル順</option>
          <option value="finishedAt">読了日順</option>
        </select>
      </div>

      {visibleBooks.length === 0 ? (
        <p className="empty-state">本がありません。「本を追加」から登録してください。</p>
      ) : (
        <ul className="book-list">
          {visibleBooks.map((book) => {
            const ratio = progressRatio(book);
            return (
              <li key={book.id} className="book-row">
                <Link to={`/books/${book.id}`} className="book-row-link">
                  <div className="book-row-main">
                    <span className="book-title">{book.title}</span>
                    <span className="book-authors">{book.authors.join(", ")}</span>
                  </div>
                  <div className="book-row-meta">
                    <StatusBadge status={book.status} />
                    {ratio !== null && (
                      <span className="progress-text">{Math.round(ratio * 100)}%</span>
                    )}
                    <RatingInput value={book.rating} readOnly />
                    <span className="card-count">カード{cardCountByBook.get(book.id) ?? 0}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function compare(a: Book, b: Book, key: SortKey): number {
  switch (key) {
    case "title":
      return a.title.localeCompare(b.title, "ja");
    case "finishedAt":
      return (b.finishedAt ?? "").localeCompare(a.finishedAt ?? "");
    case "createdAt":
      return b.createdAt.localeCompare(a.createdAt);
    case "updatedAt":
    default:
      return b.updatedAt.localeCompare(a.updatedAt);
  }
}
