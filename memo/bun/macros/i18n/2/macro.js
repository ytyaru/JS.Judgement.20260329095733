// macro.ts
import locales from "./locales.json" with { type: "json" };
export function t(path) {
  const lang = process.env.APP_LANG || "ja";
  // ドット区切りの文字列を分解して、JSONの深い階層を探す
  const message = path.split('.').reduce((obj, key) => obj?.[key], locales[lang]);

  if (!message) {
    console.error(`\n❌ [i18nマクロエラー]: キー "${path}" が "${lang}" に未定義です。\nlocales.json を確認してください。`);
    process.exit(1); // これでビルドが止まり、シェルにエラーが伝わる
  }
  
  return message;
}
