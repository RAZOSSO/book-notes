import type { LibraryData } from "../types";
import { normalizeData } from "../store/LibraryContext";

const APP_ID = "book-notes";
const BACKUP_VERSION = 1;
const LAST_BACKUP_KEY = "book-notes:last-backup-at";

interface BackupFile {
  app: typeof APP_ID;
  version: number;
  exportedAt: string;
  data: LibraryData;
}

export function createBackupJson(data: LibraryData): string {
  const backup: BackupFile = {
    app: APP_ID,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
  return JSON.stringify(backup, null, 2);
}

export function backupFilename(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `読書ノート-バックアップ-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
}

/** Parse a backup file's text. Throws an Error with a user-facing message. */
export function parseBackup(text: string): LibraryData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text.trim());
  } catch {
    throw new Error("バックアップファイルとして読み込めませんでした。保存したファイルをそのまま選んでください。");
  }
  if (
    !parsed ||
    typeof parsed !== "object" ||
    (parsed as Partial<BackupFile>).app !== APP_ID ||
    typeof (parsed as Partial<BackupFile>).data !== "object"
  ) {
    throw new Error("読書ノートのバックアップファイルではないようです。");
  }
  const data = normalizeData((parsed as BackupFile).data);
  if (!Array.isArray(data.books)) {
    throw new Error("バックアップの中身が壊れているようです。");
  }
  return data;
}

export function getLastBackupAt(): string | null {
  try {
    return localStorage.getItem(LAST_BACKUP_KEY);
  } catch {
    return null;
  }
}

export function markBackedUp(): string {
  const now = new Date().toISOString();
  try {
    localStorage.setItem(LAST_BACKUP_KEY, now);
  } catch {
    // best-effort
  }
  return now;
}

/**
 * Hand the backup to the user. On phones this opens the share sheet
 * (iPhone: "ファイルに保存"); elsewhere it downloads the file.
 * Returns false if the user cancelled the share sheet.
 */
export async function saveBackupFile(json: string, filename: string): Promise<boolean> {
  const file = new File([json], filename, { type: "application/json" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
      return true;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return false;
      // fall through to a plain download
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
