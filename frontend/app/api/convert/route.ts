import { createClient } from "@supabase/supabase-js";

type StyleProfile = { id: number; name: string };

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!apiKey) return Response.json({ error: "サーバーにGemini APIキーが設定されていません。" }, { status: 503 });
  if (!supabaseUrl || !supabaseKey) return Response.json({ error: "Supabaseの接続設定がありません。" }, { status: 503 });

  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) return Response.json({ error: "ゲスト認証が必要です。" }, { status: 401 });

  const authClient = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await authClient.auth.getUser(accessToken);
  if (authError || !authData.user) return Response.json({ error: "ゲスト認証を確認できませんでした。" }, { status: 401 });

  let body: { styleProfileId?: unknown; originalText?: unknown; profiles?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "リクエストの形式が正しくありません。" }, { status: 400 });
  }

  const originalText = typeof body.originalText === "string" ? body.originalText.trim() : "";
  const profiles = Array.isArray(body.profiles)
    ? (body.profiles as StyleProfile[]).filter((profile) => Number.isSafeInteger(profile?.id) && typeof profile?.name === "string")
    : [];

  if (!originalText || originalText.length > 1000) {
    return Response.json({ error: "元の文章を1〜1000文字で入力してください。" }, { status: 400 });
  }
  if (profiles.length === 0 || profiles.length > 100) {
    return Response.json({ error: "変換スタイルの候補を取得できませんでした。" }, { status: 400 });
  }
  const styleProfileId = Number(body.styleProfileId);
  const selectedStyle = profiles.find((profile) => profile.id === styleProfileId);
  if (!selectedStyle) return Response.json({ error: "変換スタイルを選び直してください。" }, { status: 400 });

  const prompt = `あなたは文章変換AIです。
入力文の意味・事実関係をできるだけ維持し、指定された文体に変換してください。
固有名詞、数字、日時、場所は可能な限り保持してください。
出力は変換後の文章だけにしてください。説明、前置き、注釈、JSON、箇条書きは不要です。
SNS投稿として自然で、元の文章より極端に長くならないようにしてください。

指定文体：
赤ちゃん：赤ちゃん語。したっ足らず。漢字を使用しない。赤ちゃん化、語尾「でちゅ」「ばぶー」、擬音を使う。
小学生：「100兆」「レベル99999」等で盛る。漢字は小3レベル（簡単）まで、文法は崩して「〜だし！」「神！」「最強！」等の頭の悪いハイテンションにする。
中学生：中二病。大げさな漢字、闇・魂・禁忌・封印などの表現を使う。
高校生：Z世代風。JK言葉、SNSスラング、短文、テンションの高い表現を使う。
大学生（冷笑）：高みからの冷ややかな煽り・ひろゆき風レスバ調・自己防衛。必須ワード「流石に草」「キツいって」「〜知らんけどｗ」「普通にバグ」「コスパ」。入力文の熱量や行動を客観視できていないと一歩引いて小バカにする。文末に「〜知らんけどｗ」「〜な件」等を添えて断定を避ける。「コスパ」「知能」等を交え、短文で冷淡に切り捨てる。
アラサー：「ワロタｗｗ」「〜不可避」「〜な件」「キボンヌ」「〜だお（＾ω＾）」等の往年スラングやAA顔文字を散りばめ、自虐と過剰表現を交えたネット掲示板（2ch）風にする。
中年：おじさん構文。絵文字、カタカナ、語尾「ネ」「ヨ」、馴れ馴れしい表現を使う。
老人：古文にする。「〜なり」「〜けり」「〜侍り」などの古典的表現を使う。

文体：${selectedStyle.name}
入力文：${originalText}`;

  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  let geminiResponse: Response;
  try {
    geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });
  } catch {
    return Response.json({ error: "Geminiに接続できませんでした。" }, { status: 502 });
  }

  const result = await geminiResponse.json().catch(() => null) as {
    error?: { message?: string };
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  } | null;
  if (!geminiResponse.ok) {
    return Response.json({ error: result?.error?.message || "Geminiで文章を変換できませんでした。" }, { status: 502 });
  }

  const generatedText = result?.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
  if (!generatedText.trim()) return Response.json({ error: "Geminiから変換文が返りませんでした。もう一度お試しください。" }, { status: 502 });
  return Response.json({ convertedText: generatedText.trim() });
}
