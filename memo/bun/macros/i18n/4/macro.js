import locales from "./locales.json" with { type: "json" };
export function t(path) {
  // デフォルト値 "ja" を削除。環境変数が空なら即エラー。
  const lang = process.env.APP_LANG;

  if (!lang) {
    const errorMsg = `\n[i18n Error]: 環境変数 "APP_LANG" が設定されていません。ビルドスクリプトを確認してください。`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  const langObj = locales[lang];
  if (!langObj) {
    const errorMsg = `\n[i18n Error]: locales.json 内に言語 "${lang}" の定義が見つかりません。`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  const message = path.split('.').reduce((obj, key) => obj?.[key], langObj);

  if (!message) {
    const errorMsg = `\n[i18n Error]: キー "${path}" は "${lang}" 内に未定義です。`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  
  return message;
}
