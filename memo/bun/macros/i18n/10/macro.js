import locales from "./locales.json" with { type: "json" };
export function t(path) {
  const lang = process.env.APP_LANG;
  const message = path.split('.').reduce((obj, key) => obj?.[key], locales[lang]);

  if (!message) {
    // 1. あなたが求めている日本語メッセージを出す
    console.error(`❌ [i18nエラー]: キー "${path}" は、locales.json の "${lang}" 内に定義されていません。`);
    // 2. Bunに「これは不正なマクロ実行だ」と強制的に認識させ、ビルドを失敗させる
    throw null; 
  }
  
  return message;
}

