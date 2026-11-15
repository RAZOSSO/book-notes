import { useState } from "react";
import { AiModal } from "./AiModal";
import { suggestActions, type BookContext } from "../utils/ai";

export function AiActionsModal({
  ctx,
  onAdd,
  onClose,
}: {
  ctx: BookContext;
  onAdd: (text: string) => void;
  onClose: () => void;
}) {
  const [added, setAdded] = useState<Set<number>>(new Set());

  return (
    <AiModal
      title="次の行動の提案"
      loadingText="小さな行動を考えています…"
      run={(apiKey) => {
        setAdded(new Set());
        return suggestActions(apiKey, ctx);
      }}
      onClose={onClose}
      header={<p className="hint">やってみたいものを「追加」してください。追加した行動は1週間後にふりかえります。</p>}
    >
      {(actions) => (
        <ul className="ai-action-list">
          {actions.map((a, i) => (
            <li key={i}>
              <span>{a}</span>
              <button
                type="button"
                className="btn"
                disabled={added.has(i)}
                onClick={() => {
                  onAdd(a);
                  setAdded((prev) => new Set(prev).add(i));
                }}
              >
                {added.has(i) ? "追加しました" : "追加"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </AiModal>
  );
}
