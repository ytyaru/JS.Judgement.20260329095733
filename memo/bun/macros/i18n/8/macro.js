import locales from "./locales.json" with { type: "json" };
export function t(path) {
  const lang = process.env.APP_LANG;
  const langObj = locales[lang];
  const message = path.split('.').reduce((obj, key) => obj?.[key], langObj);

  if (!message) {
    // 💡 確実にビルドスクリプトで検知できるよう、定型文を stderr に出す
    // 改行を含めず、1行で情報を出すのがコツです
    console.error(`__I18N_ERROR__:${path}:${lang}`);
    return `MISSING_KEY`; 
  }
  
  return message;
}
