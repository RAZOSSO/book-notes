import type { Book } from "../types";

export function progressRatio(book: Book): number | null {
  if (!book.totalPages || book.totalPages <= 0) return null;
  const current = book.currentPage ?? 0;
  return Math.min(1, Math.max(0, current / book.totalPages));
}

export function formatDate(iso: string | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function formatDateTime(iso: string | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${formatDate(iso)} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
}

export function isThisYear(iso: string | undefined): boolean {
  if (!iso) return false;
  const now = new Date();
  const d = new Date(iso);
  return d.getFullYear() === now.getFullYear();
}

export function isThisMonth(iso: string | undefined): boolean {
  if (!iso) return false;
  const now = new Date();
  const d = new Date(iso);
  return (
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  );
}
