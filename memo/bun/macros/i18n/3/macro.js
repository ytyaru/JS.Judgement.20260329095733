// macro.ts
import locales from "./locales.json" with { type: "json" };
export function t(path) {
  const lang = process.env.APP_LANG || "ja";
  // locales[lang] が存在しない場合の考慮も追加
  const langObj = locales[lang];
  if (!langObj) {
     throw new Error(`[i18n] locales.json 内に言語 "${lang}" の定義が見つかりません。`);
  }
  const message = path.split('.').reduce((obj, key) => obj?.[key], langObj);
  if (!message) {
    // 💡 あえて「値」を返さないことで、Bunに「マクロの実行失敗」を通知させます
    // メッセージに [i18n] と付けておくと判別しやすくなります
    const errorMsg = `\n[i18n Error]: キー "${path}" は、locales.json の "${lang}" オブジェクト内に定義されていません。`;
    console.error(errorMsg);
    throw new Error(errorMsg); 
  }
  return message;
}
