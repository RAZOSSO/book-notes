import Anthropic from "@anthropic-ai/sdk";

export class MissingApiKeyError extends Error {}
export class InvalidApiKeyError extends Error {}

// eslint-disable-next-line no-control-regex
const ASCII_ONLY = /^[\x00-\xFF]*$/;

export async function summarizeMemos(
  apiKey: string,
  bookTitle: string,
  memoTexts: string[],
): Promise<string> {
  const trimmedKey = apiKey.trim();
  if (!trimmedKey) {
    throw new MissingApiKeyError("APIキーが設定されていません");
  }
  if (!ASCII_ONLY.test(trimmedKey)) {
    throw new InvalidApiKeyError(
      "APIキーに日本語など半角英数字以外の文字が含まれています。設定画面でAnthropicのAPIキー（sk-ant- で始まる文字列）を貼り直してください。",
    );
  }

  const client = new Anthropic({ apiKey: trimmedKey, dangerouslyAllowBrowser: true });

  const notes = memoTexts.map((t, i) => `[${i + 1}] ${t}`).join("\n\n");

  const response = await client.messages.create({
    model: "claude-haiku-5-5",
    max_tokens: 1024,
    thinking: { type: "adaptive" },
    output_config: { effort: "low" },
    system:
      "あなたは読書メモの整理を手伝うアシスタントです。ユーザーが読みながら自由に書き足したメモ（書いた順、断片的で構いません）を渡すので、内容を保ちながら簡潔な日本語でまとめてください。箇条書き3〜6個程度で、重複や言い換えは整理し、元のメモにない情報は付け加えないでください。",
    messages: [
      {
        role: "user",
        content: `書名: 「${bookTitle}」\n\nメモ（書いた順）:\n${notes}\n\n上記のメモを、箇条書きで簡潔にまとめてください。`,
      },
    ],
  });

  const textBlock = response.content.find(
    (b): b is Anthropic.TextBlock => b.type === "text",
  );
  return textBlock?.text.trim() ?? "";
}
