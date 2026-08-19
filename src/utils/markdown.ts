import { STATUS_LABEL } from "../types";
import type { ActionItem, Book, Card, FinishSummary, Memo, Tag } from "../types";

function tagNames(tagIds: string[], tags: Tag[]): string[] {
  return tagIds
    .map((id) => tags.find((t) => t.id === id)?.name)
    .filter((n): n is string => Boolean(n));
}

function cardBlock(card: Card, tags: Tag[]): string {
  const heading = card.page ? `### p.${card.page}` : "### （ページ未指定）";
  const names = tagNames(card.tagIds, tags);
  const lines = [heading, "", `> ${card.quote.replace(/\n/g, "\n> ")}`, "", card.comment];
  if (names.length > 0) {
    lines.push("", `タグ: ${names.join(", ")}`);
  }
  return lines.join("\n");
}

export function exportBookToMarkdown(
  book: Book,
  cards: Card[],
  summary: FinishSummary | undefined,
  actionItems: ActionItem[],
  tags: Tag[],
  memos: Memo[] = [],
): string {
  const lines: string[] = [];
  lines.push(`# ${book.title}`, "");
  lines.push(`- 著者: ${book.authors.join(", ") || "-"}`);
  lines.push(`- 状態: ${STATUS_LABEL[book.status]}`);
  lines.push(`- 評価: ${book.rating ? `${"★".repeat(book.rating)}(${book.rating}/5)` : "-"}`);
  lines.push(`- 読了日: ${book.finishedAt ?? "-"}`);
  const nonEmptyMemos = memos.filter((m) => m.text.trim());
  if (nonEmptyMemos.length > 0) {
    lines.push("");
    lines.push("## メモ", "");
    const sortedMemos = [...nonEmptyMemos].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    for (const m of sortedMemos) {
      lines.push(m.text.trim(), "");
    }
  }
  lines.push("");
  lines.push("## まとめ", "");
  lines.push(summary?.summary?.trim() || "（未記入）");
  lines.push("");
  lines.push("## 次の行動", "");
  if (actionItems.length === 0) {
    lines.push("（なし）");
  } else {
    for (const item of actionItems) {
      lines.push(`- [${item.done ? "x" : " "}] ${item.text}`);
    }
  }
  lines.push("");
  lines.push("## カード", "");
  const sorted = [...cards].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  if (sorted.length === 0) {
    lines.push("（カードなし）");
  } else {
    for (const card of sorted) {
      lines.push(cardBlock(card, tags), "");
    }
  }
  return lines.join("\n").trimEnd() + "\n";
}

export function exportCardsByTagToMarkdown(
  label: string,
  cardsWithBook: { card: Card; book: Book }[],
  tags: Tag[],
): string {
  const lines: string[] = [`# ${label}`, ""];
  const byBook = new Map<string, { book: Book; cards: Card[] }>();
  for (const { card, book } of cardsWithBook) {
    const entry = byBook.get(book.id);
    if (entry) {
      entry.cards.push(card);
    } else {
      byBook.set(book.id, { book, cards: [card] });
    }
  }
  if (byBook.size === 0) {
    lines.push("（該当するカードはありません）");
    return lines.join("\n") + "\n";
  }
  for (const { book, cards } of byBook.values()) {
    lines.push(`## ${book.title}`, "");
    const sorted = [...cards].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    for (const card of sorted) {
      lines.push(cardBlock(card, tags), "");
    }
  }
  return lines.join("\n").trimEnd() + "\n";
}
