// macro.ts
import locales from "./locales.json" with { type: "json" };
export function t(key) {
  // 環境変数から言語を取得（ビルド時に決定される）
  const lang = process.env.APP_LANG || "ja";
  const message = locales[lang]?.[key];

  if (!message) {
    // ここで投げたエラーがビルド時のエラーメッセージになる
    throw new Error(
      `\n[i18nマクロエラー]: キー "${key}" が "${lang}" に未定義です。\nlocales.json を確認してください。`
    );
  }
  return message;
}
