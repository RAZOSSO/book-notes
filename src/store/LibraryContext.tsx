import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  ActionItem,
  AiSummary,
  Book,
  BookStatus,
  Card,
  FinishSummary,
  LibraryData,
  Memo,
  Tag,
} from "../types";
import { createId } from "../utils/id";

const STORAGE_KEY = "book-notes:v1";

function emptyData(): LibraryData {
  return {
    books: [],
    cards: [],
    finishSummaries: [],
    actionItems: [],
    tags: [],
    memos: [],
    aiSummaries: [],
  };
}

function loadData(): LibraryData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw) as Partial<LibraryData>;
    return {
      books: parsed.books ?? [],
      cards: parsed.cards ?? [],
      finishSummaries: parsed.finishSummaries ?? [],
      actionItems: parsed.actionItems ?? [],
      tags: parsed.tags ?? [],
      memos: (parsed.memos ?? []).map((m) =>
        "id" in m && m.id ? m : { ...m, id: createId() },
      ),
      aiSummaries: parsed.aiSummaries ?? [],
    };
  } catch {
    return emptyData();
  }
}

export interface NewBookInput {
  title: string;
  authors: string[];
  totalPages?: number;
  currentPage?: number;
  status: BookStatus;
}

export interface NewCardInput {
  quote: string;
  comment: string;
  page?: number;
  tagNames: string[];
}

export interface CardUpdateInput {
  quote: string;
  comment: string;
  page?: number;
  tagNames: string[];
}

interface LibraryContextValue {
  data: LibraryData;
  addBook: (input: NewBookInput) => Book;
  updateBook: (id: string, patch: Partial<Omit<Book, "id" | "createdAt">>) => void;
  deleteBook: (id: string) => void;
  setBookStatus: (id: string, status: BookStatus) => void;
  addCard: (bookId: string, input: NewCardInput) => Card;
  updateCard: (id: string, input: CardUpdateInput) => void;
  deleteCard: (id: string) => void;
  saveFinishSummary: (bookId: string, summary: string) => void;
  addMemo: (bookId: string, text: string) => Memo;
  updateMemoText: (id: string, text: string) => void;
  deleteMemo: (id: string) => void;
  saveAiSummary: (bookId: string, text: string) => void;
  deleteAiSummary: (bookId: string) => void;
  addActionItem: (bookId: string, text: string) => ActionItem;
  toggleActionItem: (id: string) => void;
  updateActionItemText: (id: string, text: string) => void;
  deleteActionItem: (id: string) => void;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

function nowIso(): string {
  return new Date().toISOString();
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<LibraryData>(() => loadData());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const resolveTagNames = useCallback(
    (names: string[], current: Tag[]): { tagIds: string[]; tags: Tag[] } => {
      const tags = [...current];
      const tagIds: string[] = [];
      for (const raw of names) {
        const name = raw.trim();
        if (!name) continue;
        let tag = tags.find((t) => t.name === name);
        if (!tag) {
          tag = { id: createId(), name, createdAt: nowIso() };
          tags.push(tag);
        }
        if (!tagIds.includes(tag.id)) tagIds.push(tag.id);
      }
      return { tagIds, tags };
    },
    [],
  );

  const addBook = useCallback((input: NewBookInput): Book => {
    const timestamp = nowIso();
    const book: Book = {
      id: createId(),
      title: input.title.trim(),
      authors: input.authors.map((a) => a.trim()).filter(Boolean),
      totalPages: input.totalPages,
      currentPage: input.currentPage,
      status: input.status,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    setData((prev) => ({ ...prev, books: [...prev.books, book] }));
    return book;
  }, []);

  const updateBook = useCallback(
    (id: string, patch: Partial<Omit<Book, "id" | "createdAt">>) => {
      setData((prev) => ({
        ...prev,
        books: prev.books.map((b) =>
          b.id === id ? { ...b, ...patch, updatedAt: nowIso() } : b,
        ),
      }));
    },
    [],
  );

  const deleteBook = useCallback((id: string) => {
    setData((prev) => ({
      books: prev.books.filter((b) => b.id !== id),
      cards: prev.cards.filter((c) => c.bookId !== id),
      finishSummaries: prev.finishSummaries.filter((f) => f.bookId !== id),
      actionItems: prev.actionItems.filter((a) => a.bookId !== id),
      memos: prev.memos.filter((m) => m.bookId !== id),
      aiSummaries: prev.aiSummaries.filter((s) => s.bookId !== id),
      tags: prev.tags,
    }));
  }, []);

  const setBookStatus = useCallback((id: string, status: BookStatus) => {
    setData((prev) => ({
      ...prev,
      books: prev.books.map((b) => {
        if (b.id !== id) return b;
        const shouldSetFinishedAt = status === "finished" && !b.finishedAt;
        return {
          ...b,
          status,
          finishedAt: shouldSetFinishedAt
            ? nowIso().slice(0, 10)
            : b.finishedAt,
          updatedAt: nowIso(),
        };
      }),
    }));
  }, []);

  const addCard = useCallback(
    (bookId: string, input: NewCardInput): Card => {
      const timestamp = nowIso();
      let created!: Card;
      setData((prev) => {
        const { tagIds, tags } = resolveTagNames(input.tagNames, prev.tags);
        const card: Card = {
          id: createId(),
          bookId,
          quote: input.quote.trim(),
          comment: input.comment.trim(),
          page: input.page,
          tagIds,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        created = card;
        return { ...prev, cards: [...prev.cards, card], tags };
      });
      return created;
    },
    [resolveTagNames],
  );

  const updateCard = useCallback(
    (id: string, input: CardUpdateInput) => {
      setData((prev) => {
        const { tagIds, tags } = resolveTagNames(input.tagNames, prev.tags);
        return {
          ...prev,
          tags,
          cards: prev.cards.map((c) =>
            c.id === id
              ? {
                  ...c,
                  quote: input.quote.trim(),
                  comment: input.comment.trim(),
                  page: input.page,
                  tagIds,
                  updatedAt: nowIso(),
                }
              : c,
          ),
        };
      });
    },
    [resolveTagNames],
  );

  const deleteCard = useCallback((id: string) => {
    setData((prev) => ({ ...prev, cards: prev.cards.filter((c) => c.id !== id) }));
  }, []);

  const saveFinishSummary = useCallback((bookId: string, summary: string) => {
    setData((prev) => {
      const existing = prev.finishSummaries.find((f) => f.bookId === bookId);
      const timestamp = nowIso();
      if (existing) {
        return {
          ...prev,
          finishSummaries: prev.finishSummaries.map((f) =>
            f.bookId === bookId ? { ...f, summary, updatedAt: timestamp } : f,
          ),
        };
      }
      const created: FinishSummary = {
        bookId,
        summary,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      return { ...prev, finishSummaries: [...prev.finishSummaries, created] };
    });
  }, []);

  const addMemo = useCallback((bookId: string, text: string): Memo => {
    const timestamp = nowIso();
    const memo: Memo = {
      id: createId(),
      bookId,
      text: text.trim(),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    setData((prev) => ({ ...prev, memos: [...prev.memos, memo] }));
    return memo;
  }, []);

  const updateMemoText = useCallback((id: string, text: string) => {
    setData((prev) => ({
      ...prev,
      memos: prev.memos.map((m) =>
        m.id === id ? { ...m, text: text.trim(), updatedAt: nowIso() } : m,
      ),
    }));
  }, []);

  const deleteMemo = useCallback((id: string) => {
    setData((prev) => ({ ...prev, memos: prev.memos.filter((m) => m.id !== id) }));
  }, []);

  const saveAiSummary = useCallback((bookId: string, text: string) => {
    const timestamp = nowIso();
    setData((prev) => {
      const existing = prev.aiSummaries.find((s) => s.bookId === bookId);
      const next: AiSummary = {
        bookId,
        text: text.trim(),
        createdAt: existing?.createdAt ?? timestamp,
        updatedAt: timestamp,
      };
      return {
        ...prev,
        aiSummaries: [...prev.aiSummaries.filter((s) => s.bookId !== bookId), next],
      };
    });
  }, []);

  const deleteAiSummary = useCallback((bookId: string) => {
    setData((prev) => ({
      ...prev,
      aiSummaries: prev.aiSummaries.filter((s) => s.bookId !== bookId),
    }));
  }, []);

  const addActionItem = useCallback((bookId: string, text: string): ActionItem => {
    const timestamp = nowIso();
    const item: ActionItem = {
      id: createId(),
      bookId,
      text: text.trim(),
      done: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    setData((prev) => ({ ...prev, actionItems: [...prev.actionItems, item] }));
    return item;
  }, []);

  const toggleActionItem = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      actionItems: prev.actionItems.map((a) =>
        a.id === id ? { ...a, done: !a.done, updatedAt: nowIso() } : a,
      ),
    }));
  }, []);

  const updateActionItemText = useCallback((id: string, text: string) => {
    setData((prev) => ({
      ...prev,
      actionItems: prev.actionItems.map((a) =>
        a.id === id ? { ...a, text: text.trim(), updatedAt: nowIso() } : a,
      ),
    }));
  }, []);

  const deleteActionItem = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      actionItems: prev.actionItems.filter((a) => a.id !== id),
    }));
  }, []);

  const value = useMemo<LibraryContextValue>(
    () => ({
      data,
      addBook,
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
      updateActionItemText,
      deleteActionItem,
    }),
    [
      data,
      saveAiSummary,
      deleteAiSummary,
      addBook,
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
      addActionItem,
      toggleActionItem,
      updateActionItemText,
      deleteActionItem,
    ],
  );

  return (
    <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
  );
}

export function useLibrary(): LibraryContextValue {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used within LibraryProvider");
  return ctx;
}
