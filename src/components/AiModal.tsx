import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { describeAiError } from "../utils/ai";
import { getApiKey } from "../utils/settings";

type State<T> =
  | { status: "loading" }
  | { status: "done"; result: T }
  | { status: "missing-key" }
  | { status: "invalid-key" | "error"; message: string };

/**
 * Modal that runs one AI request when it opens and shows loading / error
 * states. `children` renders the result; `actions` adds buttons next to
 * 閉じる once the result is in. Changing `runKey` (or pressing 作り直す)
 * runs the request again.
 */
export function AiModal<T>({
  title,
  loadingText,
  run,
  runKey,
  header,
  children,
  actions,
  onClose,
}: {
  title: string;
  loadingText: string;
  run: (apiKey: string) => Promise<T>;
  runKey?: string;
  header?: ReactNode;
  children: (result: T) => ReactNode;
  actions?: (result: T) => ReactNode;
  onClose: () => void;
}) {
  const [state, setState] = useState<State<T>>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    const apiKey = getApiKey();
    if (!apiKey) {
      setState({ status: "missing-key" });
      return;
    }
    run(apiKey).then(
      (result) => {
        if (!cancelled) setState({ status: "done", result });
      },
      (err: unknown) => {
        if (cancelled) return;
        const { kind, message } = describeAiError(err);
        setState(kind === "missing-key" ? { status: "missing-key" } : { status: kind, message });
      },
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, runKey]);

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal export-modal ai-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{title}</h3>
        {header}

        {state.status === "loading" && <p className="hint">{loadingText}</p>}

        {state.status === "missing-key" && (
          <p className="form-error">
            APIキーが未設定です。<Link to="/settings">設定画面</Link>でAnthropic APIキーを登録してください。
          </p>
        )}

        {state.status === "invalid-key" && (
          <p className="form-error">
            {state.message}
            <br />
            <Link to="/settings">設定画面</Link>を開く
          </p>
        )}

        {state.status === "error" && <p className="form-error">{state.message}</p>}

        {state.status === "done" && children(state.result)}

        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            閉じる
          </button>
          {(state.status === "done" || state.status === "error") && (
            <button type="button" className="btn" onClick={() => setAttempt((n) => n + 1)}>
              作り直す
            </button>
          )}
          {state.status === "done" && actions?.(state.result)}
        </div>
      </div>
    </div>
  );
}
