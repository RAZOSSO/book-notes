import { useState } from "react";
import { AiModal } from "./AiModal";
import { generateQuestions, type BookContext } from "../utils/ai";

/** Turn answered questions into a block for the finish summary. */
function formatAnswers(questions: string[], answers: Record<number, string>): string {
  const blocks = questions
    .map((q, i) => ({ q, a: (answers[i] ?? "").trim() }))
    .filter(({ a }) => a)
    .map(({ q, a }) => `Q. ${q}\nA. ${a}`);
  return blocks.length ? `【AIからの質問に答えて】\n${blocks.join("\n\n")}` : "";
}

export function AiQuestionsModal({
  ctx,
  onSave,
  onClose,
}: {
  ctx: BookContext;
  onSave: (text: string) => void;
  onClose: () => void;
}) {
  const [answers, setAnswers] = useState<Record<number, string>>({});

  return (
    <AiModal
      title="AIからの質問"
      loadingText="質問を考えています…"
      run={(apiKey) => {
        setAnswers({});
        return generateQuestions(apiKey, ctx);
      }}
      onClose={onClose}
      header={
        <p className="hint">
          何も見ずに、自分の言葉で答えてみてください。答えた質問だけが読了まとめに追加されます。
        </p>
      }
      actions={(questions) => {
        const text = formatAnswers(questions, answers);
        return (
          <button
            type="button"
            className="btn btn-primary"
            disabled={!text}
            onClick={() => {
              onSave(text);
              onClose();
            }}
          >
            読了まとめに追加
          </button>
        );
      }}
    >
      {(questions) => (
        <ol className="ai-question-list">
          {questions.map((q, i) => (
            <li key={i}>
              <p className="ai-question">{q}</p>
              <textarea
                rows={3}
                value={answers[i] ?? ""}
                placeholder="自分の言葉で答える"
                onChange={(e) => setAnswers((prev) => ({ ...prev, [i]: e.target.value }))}
              />
            </li>
          ))}
        </ol>
      )}
    </AiModal>
  );
}
