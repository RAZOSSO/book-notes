import { useState } from "react";
import { AiModal } from "./AiModal";
import { PLATFORM_LABEL, writePost, type BookContext, type PostPlatform } from "../utils/ai";

const PLATFORMS: PostPlatform[] = ["x", "note", "instagram"];

export function AiPostModal({ ctx, onClose }: { ctx: BookContext; onClose: () => void }) {
  const [platform, setPlatform] = useState<PostPlatform>("x");
  const [draft, setDraft] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  return (
    <AiModal
      title="発信用の文章"
      loadingText="下書きを作っています…"
      runKey={platform}
      run={(apiKey) => {
        setDraft(null);
        return writePost(apiKey, ctx, platform);
      }}
      onClose={onClose}
      header={
        <div className="status-tabs">
          {PLATFORMS.map((p) => (
            <button
              key={p}
              type="button"
              className={platform === p ? "tab active" : "tab"}
              onClick={() => setPlatform(p)}
            >
              {PLATFORM_LABEL[p]}
            </button>
          ))}
        </div>
      }
      actions={(result) => (
        <button
          type="button"
          className="btn btn-primary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(draft ?? result);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? "コピーしました" : "コピー"}
        </button>
      )}
    >
      {(result) => (
        <>
          <textarea
            className="export-preview"
            rows={12}
            value={draft ?? result}
            onChange={(e) => setDraft(e.target.value)}
          />
          <p className="hint">
            {(draft ?? result).length}文字。自分の言葉に直してから投稿するのがおすすめです。
          </p>
        </>
      )}
    </AiModal>
  );
}
