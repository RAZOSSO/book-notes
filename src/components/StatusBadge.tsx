import { STATUS_LABEL, type BookStatus } from "../types";

export function StatusBadge({ status }: { status: BookStatus }) {
  return <span className={`status-badge status-${status}`}>{STATUS_LABEL[status]}</span>;
}
