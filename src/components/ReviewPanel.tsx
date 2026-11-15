import { useMemo } from "react";
import { Link } from "react-router-dom";
import { dueReviews, useLibrary } from "../store/LibraryContext";

/** "1週間たったけど、やれた？" prompts for action items whose review is due. */
export function ReviewPanel() {
  const { data, reviewActionItem } = useLibrary();
  const due = useMemo(() => dueReviews(data.actionItems), [data.actionItems]);

  if (due.length === 0) return null;

  return (
    <section className="review-panel">
      <h2>ふりかえり：この行動、やれた？</h2>
      <ul>
        {due.map((item) => {
          const book = data.books.find((b) => b.id === item.bookId);
          return (
            <li key={item.id}>
              <p className="review-action">{item.text}</p>
              {book && (
                <Link to={`/books/${book.id}`} className="hint">
                  『{book.title}』
                </Link>
              )}
              <div className="review-buttons">
                <button type="button" className="btn btn-primary" onClick={() => reviewActionItem(item.id, "done")}>
                  できた
                </button>
                <button type="button" className="btn" onClick={() => reviewActionItem(item.id, "later")}>
                  もう1週間
                </button>
                <button type="button" className="btn-link" onClick={() => reviewActionItem(item.id, "stop")}>
                  聞かないで
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
