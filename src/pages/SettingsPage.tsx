import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getApiKey, setApiKey } from "../utils/settings";
import { useLibrary } from "../store/LibraryContext";
import { ConfirmDialog } from "../components/ConfirmDialog";
import type { LibraryData } from "../types";
import {
  backupFilename,
  createBackupJson,
  getLastBackupAt,
  markBackedUp,
  parseBackup,
  saveBackupFile,
} from "../utils/backup";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function BackupSection() {
  const { data, replaceAll } = useLibrary();
  const [lastBackupAt, setLastBackupAt] = useState(() => getLastBackupAt());
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState<LibraryData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setError("");
    setMessage("");
    const saved = await saveBackupFile(createBackupJson(data), backupFilename());
    if (saved) {
      setLastBackupAt(markBackedUp());
      setMessage("バックアップを書き出しました。");
    }
  };

  const handleFile = async (file: File | undefined) => {
    setError("");
    setMessage("");
    if (!file) return;
    try {
      setPending(parseBackup(await file.text()));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <section className="book-section">
      <h2>バックアップ</h2>
      <p className="hint">
        本・メモ・カード・まとめなど、この端末に保存されている読書データをまるごと1つのファイルに書き出します。
        機種変更やデータが消えたときは、そのファイルから元に戻せます。APIキーはファイルに含まれません。
      </p>
      <p className="hint">
        今のデータ：本 {data.books.length} 冊／メモ {data.memos.length} 件／カード {data.cards.length} 枚
        <br />
        最後のバックアップ：{lastBackupAt ? formatDateTime(lastBackupAt) : "まだありません"}
      </p>
      <div className="modal-actions">
        <button type="button" className="btn" onClick={() => fileInputRef.current?.click()}>
          バックアップから復元
        </button>
        <button type="button" className="btn btn-primary" onClick={handleSave}>
          バックアップを保存
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {message && <p className="hint">{message}</p>}
      {error && <p className="form-error">{error}</p>}

      <ConfirmDialog
        open={pending !== null}
        title="バックアップから復元しますか"
        message={
          pending
            ? `今この端末にあるデータ（本 ${data.books.length} 冊）は消え、バックアップの内容（本 ${pending.books.length} 冊／メモ ${pending.memos.length} 件／カード ${pending.cards.length} 枚）に置き換わります。`
            : ""
        }
        confirmLabel="復元する"
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) replaceAll(pending);
          setPending(null);
          setMessage("バックアップから復元しました。");
        }}
      />
    </section>
  );
}

// eslint-disable-next-line no-control-regex
const ASCII_ONLY = /^[\x00-\xFF]*$/;

export function SettingsPage() {
  const [key, setKey] = useState(() => getApiKey());
  const [saved, setSaved] = useState(false);
  const [reveal, setReveal] = useState(false);

  const handleSave = () => {
    setApiKey(key);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleClear = () => {
    setApiKey("");
    setKey("");
  };

  const hasInvalidChars = key.trim().length > 0 && !ASCII_ONLY.test(key.trim());

  return (
    <div className="page settings-page">
      <header className="page-header">
        <Link to="/" className="btn-link">
          ← 棚に戻る
        </Link>
        <h1>設定</h1>
      </header>

      <section className="book-section">
        <h2>Anthropic APIキー</h2>
        <p className="hint">
          「メモをAIでまとめる」機能で使用します。キーはこの端末のブラウザ内（localStorage）にのみ保存され、要約時にご自身のキーで
          Anthropic API へ直接送信されます。この機能を使わない場合は設定不要です。
        </p>
        <label className="field">
          <span>APIキー</span>
          <div className="field-row">
            <input
              type={reveal ? "text" : "password"}
              className="field-grow"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="sk-ant-..."
              autoComplete="off"
            />
            <button type="button" className="btn field-small" onClick={() => setReveal((v) => !v)}>
              {reveal ? "隠す" : "表示"}
            </button>
          </div>
        </label>
        {hasInvalidChars && (
          <p className="form-error">
            日本語など半角英数字以外の文字が含まれています。コピー元を確認し、Anthropicの正しいAPIキー（
            <code>sk-ant-</code> で始まる半角英数字）を貼り直してください。
          </p>
        )}
        <div className="modal-actions">
          <button type="button" className="btn" onClick={handleClear}>
            削除
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            {saved ? "保存しました" : "保存"}
          </button>
        </div>
      </section>

      <BackupSection />
    </div>
  );
}
