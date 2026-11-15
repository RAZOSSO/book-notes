import Anthropic from "@anthropic-ai/sdk";
import type { ActionItem, Book, Card, FinishSummary, Memo } from "../types";

export class MissingApiKeyError extends Error {}
export class InvalidApiKeyError extends Error {}

const MODEL = "claude-haiku-5-5";

// eslint-disable-next-line no-control-regex
const ASCII_ONLY = /^[\x00-\xFF]*$/;

/** Everything the AI features may draw on for one book. */
export interface BookContext {
  book: Book;
  memos: Memo[];
  cards: Card[];
  summary?: FinishSummary;
  actionItems?: ActionItem[];
}

function createClient(apiKey: string): Anthropic {
  const trimmedKey = apiKey.trim();
  if (!trimmedKey) {
    throw new MissingApiKeyError("APIキーが設定されていません");
  }
  if (!ASCII_ONLY.test(trimmedKey)) {
    throw new InvalidApiKeyError(
      "APIキーに日本語など半角英数字以外の文字が含まれています。設定画面でAnthropicのAPIキー（sk-ant- で始まる文字列）を貼り直してください。",
    );
  }
  return new Anthropic({ apiKey: trimmedKey, dangerouslyAllowBrowser: true });
}

function byCreated<T extends { createdAt: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Render the book's notes as plain text for the prompt. Empty sections are left out. */
function describeBook(ctx: BookContext): string {
  const parts: string[] = [`書名: 「${ctx.book.title}」`];
  if (ctx.book.authors.length) parts.push(`著者: ${ctx.book.authors.join("、")}`);

  const memos = byCreated(ctx.memos).filter((m) => m.text.trim());
  if (memos.length) {
    parts.push(
      `\n# 読みながら書いたメモ（書いた順）\n${memos.map((m, i) => `[${i + 1}] ${m.text.trim()}`).join("\n\n")}`,
    );
  }

  const cards = byCreated(ctx.cards).filter((c) => c.quote.trim() || c.comment.trim());
  if (cards.length) {
    const lines = cards.map((c) => {
      const page = c.page ? `p.${c.page} ` : "";
      const quote = c.quote.trim() ? `引用: ${c.quote.trim()}` : "";
      const comment = c.comment.trim() ? ` ／ 自分のコメント: ${c.comment.trim()}` : "";
      return `- ${page}${quote}${comment}`;
    });
    parts.push(`\n# 印象に残った箇所（カード）\n${lines.join("\n")}`);
  }

  const summary = ctx.summary?.summary?.trim();
  if (summary) parts.push(`\n# 読了まとめ\n${summary}`);

  const actions = (ctx.actionItems ?? []).filter((a) => a.text.trim());
  if (actions.length) {
    parts.push(`\n# すでに決めている次の行動\n${actions.map((a) => `- ${a.text.trim()}`).join("\n")}`);
  }
  return parts.join("\n");
}

function checkStop(response: Anthropic.Message): void {
  if (response.stop_reason === "refusal") {
    throw new Error("AIがこの内容への回答を断りました。メモの内容を見直してから、もう一度お試しください。");
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error("AIの回答が長くなりすぎて途中で止まりました。もう一度お試しください。");
  }
}

async function askText(apiKey: string, system: string, user: string): Promise<string> {
  const client = createClient(apiKey);
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium" },
    system,
    messages: [{ role: "user", content: user }],
  });
  checkStop(response);
  const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  return textBlock?.text.trim() ?? "";
}

/** Ask for a list of short strings, using structured output so parsing is reliable. */
async function askList(apiKey: string, system: string, user: string): Promise<string[]> {
  const client = createClient(apiKey);
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "medium",
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: { items: { type: "array", items: { type: "string" } } },
          required: ["items"],
          additionalProperties: false,
        },
      },
    },
    system,
    messages: [{ role: "user", content: user }],
  });
  checkStop(response);
  const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  try {
    const parsed = JSON.parse(textBlock?.text ?? "") as { items?: unknown };
    return Array.isArray(parsed.items)
      ? parsed.items.filter((s): s is string => typeof s === "string" && s.trim() !== "").map((s) => s.trim())
      : [];
  } catch {
    throw new Error("AIの回答を読み取れませんでした。もう一度お試しください。");
  }
}

const NOTE_STYLE =
  "ユーザーは本を読みながら、思いついたことを短い箇条書きや断片的な言葉でメモしています。1件のメモの中に複数の箇条書きが入っていることもあり、主語や文脈が省略されていることも多いので、書名と前後のメモから意味を読み取ってください。";

export function summarizeMemos(apiKey: string, ctx: BookContext): Promise<string> {
  return askText(
    apiKey,
    [
      "あなたは読書メモの整理を手伝うアシスタントです。",
      NOTE_STYLE,
      "まとめ方：",
      "- 似た内容のメモはテーマごとにまとめ、重複や言い換えは1つにする",
      "- 本の主張・印象に残った言葉と、ユーザー自身の気づき・感想は区別できるように書く",
      "- 箇条書き3〜7個程度。各項目は1〜2文で、後から読み返して意味がわかる文章にする",
      "- 元のメモにない情報や、本の内容についての推測は付け加えない。意味が読み取れないメモは無理に解釈しない",
      "出力は箇条書きのみ（「・」で始める）。前置きや締めの言葉は書かない。",
    ].join("\n"),
    // Only the memos are summarized; other notes would blur what the user wrote while reading.
    describeBook({ book: ctx.book, memos: ctx.memos, cards: [] }),
  );
}

export function generateQuestions(apiKey: string, ctx: BookContext): Promise<string[]> {
  return askList(
    apiKey,
    [
      "あなたは読書のアウトプットを手伝うコーチです。",
      NOTE_STYLE,
      "ユーザーの記録をもとに、本の内容を自分の言葉で説明し直し、自分の生活に結びつけるための質問を3つ作ってください。",
      "- 1つ目：本の中心的な考えを、自分の言葉で説明させる質問",
      "- 2つ目：メモやカードに出てくる具体的な内容に触れて、なぜそう感じたか・自分の経験とどうつながるかを聞く質問",
      "- 3つ目：読んだことで、明日から何を変えるかを聞く質問",
      "どれも、はい・いいえでは答えられず、1〜3文で答えられる質問にする。記録にない本の内容を前提にしない。",
      "items に質問文を3つ入れて返す。",
    ].join("\n"),
    describeBook(ctx),
  );
}

export function suggestActions(apiKey: string, ctx: BookContext): Promise<string[]> {
  return askList(
    apiKey,
    [
      "あなたは読書を行動に変える手伝いをするコーチです。合言葉は「微差は大差」です。",
      NOTE_STYLE,
      "ユーザーの記録をもとに、この本から得たことを生かせる「明日からできる小さな行動」を3つ提案してください。",
      "- 1日5分以内、または1回でできるくらい小さく、具体的にする（いつ・何を・どれくらい）",
      "- メモやカードに書かれた内容に結びつける。記録にない本の内容を前提にしない",
      "- すでに決めている次の行動と重ならないものにする",
      "- 各行動は40字以内の1文。「〜する」で終える",
      "items に行動を3つ入れて返す。",
    ].join("\n"),
    describeBook(ctx),
  );
}

export type PostPlatform = "x" | "note" | "instagram";

export const PLATFORM_LABEL: Record<PostPlatform, string> = {
  x: "X（旧Twitter）",
  note: "note",
  instagram: "Instagram",
};

const PLATFORM_RULES: Record<PostPlatform, string> = {
  x: "Xの1ポスト。全角140字以内。1行目で一番伝えたい気づきを書き、最後に書名を入れる。ハッシュタグは #読書 を含めて2つまで。",
  note: "noteの記事の下書き。800〜1200字。見出し（## ）を2〜4個使い、「この本を読んだきっかけ」「印象に残ったこと」「自分の行動がどう変わるか」を含める。",
  instagram: "Instagramの投稿文。300字前後。1行目は短く目を引く一言。適度に改行し、最後にハッシュタグを5つまで（#読書 #読書記録 を含める）。",
};

export function writePost(apiKey: string, ctx: BookContext, platform: PostPlatform): Promise<string> {
  return askText(
    apiKey,
    [
      "あなたは読書感想の発信を手伝うアシスタントです。",
      NOTE_STYLE,
      "ユーザーの記録をもとに、ユーザー本人が書いたように聞こえる発信用の文章を作ってください。",
      "- 一人称は「私」。です・ます調でも、だ・である調でもよいが、記録の口調に近づける",
      "- 本の要約より、ユーザー自身の気づき・感想・行動を中心にする",
      "- 記録にない本の内容や、ユーザーの体験をでっち上げない",
      "- カードの引用を使う場合は、短く「」でくくる",
      `形式：${PLATFORM_RULES[platform]}`,
      "出力は投稿する文章だけ。前置きや説明は書かない。",
    ].join("\n"),
    describeBook(ctx),
  );
}

/** Turn any error from the AI features into a message for the user. */
export function describeAiError(err: unknown): { kind: "missing-key" | "invalid-key" | "error"; message: string } {
  if (err instanceof MissingApiKeyError) return { kind: "missing-key", message: "" };
  if (err instanceof InvalidApiKeyError) return { kind: "invalid-key", message: err.message };
  // eslint-disable-next-line no-console
  console.error("[AI] 失敗しました:", err);
  if (err instanceof Anthropic.AuthenticationError) {
    return { kind: "error", message: "APIキーが正しくないか、権限がありません。設定を確認してください。" };
  }
  if (err instanceof Anthropic.RateLimitError) {
    return { kind: "error", message: "レート制限に達しました。しばらくしてから再度お試しください。" };
  }
  if (err instanceof Anthropic.APIConnectionError) {
    const cause = err.cause instanceof Error ? `${err.cause.name}: ${err.cause.message}` : String(err.cause ?? "");
    return {
      kind: "error",
      message:
        `APIに接続できませんでした（${err.message}${cause ? " / " + cause : ""}）。` +
        "ブラウザの拡張機能（広告ブロッカー等）やネットワークが api.anthropic.com への通信を止めていないか確認してください。",
    };
  }
  if (err instanceof Anthropic.APIError) {
    return { kind: "error", message: `APIエラーが発生しました（${err.status} ${err.name}）: ${err.message}` };
  }
  if (err instanceof Error) return { kind: "error", message: err.message };
  return { kind: "error", message: `予期しないエラーが発生しました: ${String(err)}` };
}
