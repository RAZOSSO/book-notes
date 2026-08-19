import { useState } from "react";

export function ExportModal({
  title,
  filename,
  markdown,
  onClose,
}: {
  title: string;
  filename: string;
  markdown: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal export-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{title}</h3>
        <textarea className="export-preview" readOnly value={markdown} />
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            閉じる
          </button>
          <button type="button" className="btn" onClick={handleCopy}>
            {copied ? "コピーしました" : "コピー"}
          </button>
          <button type="button" className="btn btn-primary" onClick={handleDownload}>
            ダウンロード
          </button>
        </div>
      </div>
    </div>
  );
}
