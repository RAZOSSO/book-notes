import { useState } from "react";
import type { Card, Tag } from "../types";
import { formatDate } from "../utils/selectors";
import { CardForm, type CardFormValues } from "./CardForm";
import { ConfirmDialog } from "./ConfirmDialog";

export function CardItem({
  card,
  tags,
  allTags,
  onUpdate,
  onDelete,
  onTagClick,
  id,
  highlighted,
}: {
  card: Card;
  tags: Tag[];
  allTags: Tag[];
  onUpdate: (values: { quote: string; comment: string; page?: number; tagNames: string[] }) => void;
  onDelete: () => void;
  onTagClick?: (tagName: string) => void;
  id?: string;
  highlighted?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (editing) {
    const initial: CardFormValues = {
      quote: card.quote,
      comment: card.comment,
      page: card.page ? String(card.page) : "",
      tagsText: tags.map((t) => t.name).join(", "),
    };
    return (
      <li className="card-item card-item-editing">
        <CardForm
          initial={initial}
          allTags={allTags}
          submitLabel="保存"
          draftKey={`card-edit-${card.id}`}
          onCancel={() => setEditing(false)}
          onSubmit={(values) => {
            onUpdate(values);
            setEditing(false);
          }}
        />
      </li>
    );
  }

  return (
    <li id={id} className={`card-item ${highlighted ? "card-item-highlighted" : ""}`}>
      <div className="card-item-header">
        <span className="card-page">{card.page ? `p.${card.page}` : ""}</span>
        <span className="card-date">{formatDate(card.createdAt)}</span>
      </div>
      <blockquote className="card-quote">{card.quote}</blockquote>
      <p className="card-comment">{card.comment}</p>
      {tags.length > 0 && (
        <div className="tag-list">
          {tags.map((t) => (
            <button
              key={t.id}
              type="button"
              className="tag-chip"
              onClick={() => onTagClick?.(t.name)}
            >
              #{t.name}
            </button>
          ))}
        </div>
      )}
      <div className="card-item-actions">
        <button type="button" className="btn-link" onClick={() => setEditing(true)}>
          編集
        </button>
        <button type="button" className="btn-link btn-link-danger" onClick={() => setConfirmDelete(true)}>
          削除
        </button>
      </div>
      <ConfirmDialog
        open={confirmDelete}
        title="カードを削除しますか"
        message="この操作は取り消せません。"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          onDelete();
        }}
      />
    </li>
  );
}
