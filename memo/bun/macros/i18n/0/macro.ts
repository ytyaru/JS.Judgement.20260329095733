// macro.ts
import locales from "./locales.json";
export function t(key: string) {
  // 環境変数から言語を取得（ビルド時に決定される）
  const lang = process.env.APP_LANG || "ja";
  return locales[lang][key] || key;
}
