import locales from "./locales.json" with { type: "json" };
export function t(path) {
  const lang = process.env.APP_LANG;
  const message = path.split('.').reduce((obj, key) => obj?.[key], locales[lang]);

  if (!message) {
    console.error(`❌ [i18nエラー]: キー "${path}" は、locales.json の "${lang}" 内に定義されていません。jsonファイルかそれを参照する以下コード箇所のキーを一致させてください。`);
    throw null; 
  }
  
  return message;
}

