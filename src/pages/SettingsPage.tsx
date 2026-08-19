import { useState } from "react";
import { Link } from "react-router-dom";
import { getApiKey, setApiKey } from "../utils/settings";

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
    </div>
  );
}
