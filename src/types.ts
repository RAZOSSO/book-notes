export type BookStatus = "tsundoku" | "reading" | "finished" | "paused";

export const STATUS_LABEL: Record<BookStatus, string> = {
  tsundoku: "積読",
  reading: "読書中",
  finished: "読了",
  paused: "中断",
};

export const STATUS_ORDER: BookStatus[] = [
  "tsundoku",
  "reading",
  "finished",
  "paused",
];

export interface Book {
  id: string;
  title: string;
  authors: string[];
  totalPages?: number;
  currentPage?: number;
  status: BookStatus;
  rating?: number; // 1-5
  finishedAt?: string; // ISO date
  createdAt: string;
  updatedAt: string;
  isbn?: string;
}

export interface Card {
  id: string;
  bookId: string;
  quote: string;
  comment: string;
  page?: number;
  tagIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FinishSummary {
  bookId: string;
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Memo {
  id: string;
  bookId: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiSummary {
  bookId: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActionItem {
  id: string;
  bookId: string;
  text: string;
  done: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  createdAt: string;
}

export interface LibraryData {
  books: Book[];
  cards: Card[];
  finishSummaries: FinishSummary[];
  actionItems: ActionItem[];
  tags: Tag[];
  memos: Memo[];
  aiSummaries: AiSummary[];
}
