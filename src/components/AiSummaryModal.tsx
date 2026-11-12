import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Anthropic from "@anthropic-ai/sdk";
import { InvalidApiKeyError, MissingApiKeyError, summarizeMemos } from "../utils/aiSummarize";
import { getApiKey } from "../utils/settings";

type Status = "loading" | "done" | "error" | "missing-key" | "invalid-key";

export function AiSummaryModal({
  bookTitle,
  memoTexts,
  onSave,
  onClose,
}: {
  bookTitle: string;
  memoTexts: string[];
  onSave: (text: string) => void;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<Status>("loading");
  const [result, setResult] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const apiKey = getApiKey();
      if (!apiKey) {
        setStatus("missing-key");
        return;
      }
      try {
        const text = await summarizeMemos(apiKey, bookTitle, memoTexts);
        if (cancelled) return;
        setResult(text);
        setStatus("done");
      } catch (err) {
        if (cancelled) return;
        if (err instanceof MissingApiKeyError) {
          setStatus("missing-key");
          return;
        }
        if (err instanceof InvalidApiKeyError) {
          setErrorMessage(err.message);
          setStatus("invalid-key");
          return;
        }
        // eslint-disable-next-line no-console
        console.error("[AIでまとめる] 要約に失敗しました:", err);

        if (err instanceof Anthropic.AuthenticationError) {
          setErrorMessage("APIキーが正しくないか、権限がありません。設定を確認してください。");
        } else if (err instanceof Anthropic.RateLimitError) {
          setErrorMessage("レート制限に達しました。しばらくしてから再度お試しください。");
        } else if (err instanceof Anthropic.APIConnectionError) {
          const cause =
            err.cause instanceof Error ? `${err.cause.name}: ${err.cause.message}` : String(err.cause ?? "");
          setErrorMessage(
            `APIに接続できませんでした（${err.message}${cause ? " / " + cause : ""}）。` +
              "ブラウザの拡張機能（広告ブロッカー等）や社内ネットワーク・プロキシが api.anthropic.com への通信を止めていないか確認してください。詳細はブラウザの開発者ツール(F12)のConsole/Networkタブにも出力しています。",
          );
        } else if (err instanceof Anthropic.APIError) {
          setErrorMessage(`APIエラーが発生しました（${err.status} ${err.name}）: ${err.message}`);
        } else if (err instanceof Error) {
          setErrorMessage(`予期しないエラーが発生しました（${err.name}）: ${err.message}`);
        } else {
          setErrorMessage(`予期しないエラーが発生しました: ${String(err)}`);
        }
        setStatus("error");
      }
    }
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal export-modal"
        role="dialog"
        aria-modal="true"
        aria-label="AIによるメモの要約"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>AIでまとめる</h3>

        {status === "loading" && <p className="hint">要約を作成しています…</p>}

        {status === "missing-key" && (
          <p className="form-error">
            APIキーが未設定です。<Link to="/settings">設定画面</Link>でAnthropic
            APIキーを登録してください。
          </p>
        )}

        {status === "invalid-key" && (
          <p className="form-error">
            {errorMessage}
            <br />
            <Link to="/settings">設定画面</Link>を開く
          </p>
        )}

        {status === "error" && <p className="form-error">{errorMessage}</p>}

        {status === "done" && (
          <textarea className="export-preview" readOnly value={result} rows={10} />
        )}

        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            閉じる
          </button>
          {status === "done" && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                onSave(result);
                onClose();
              }}
            >
              AI要約として保存
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
