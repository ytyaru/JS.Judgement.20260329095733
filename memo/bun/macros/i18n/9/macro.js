import locales from "./locales.json" with { type: "json" };
export function t(path) {
  const lang = process.env.APP_LANG;
  const message = path.split('.').reduce((obj, key) => obj?.[key], locales[lang]);

  if (!message) {
    // 💡 日本語のメッセージだけを標準エラーに出す
    console.error(`\n❌ [i18nエラー]: "${path}" が "${lang}" 内に未定義です。`);
    // ここで return しないことで、Bunに「マクロの実行失敗」を正しく認識させます
  }
  
  return message;
}
