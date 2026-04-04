import locales from "./locales.json" with { type: "json" };

export function t(path) {
  const lang = process.env.APP_LANG;
  
  if (!lang) {
    reportError(`環境変数 "APP_LANG" が未設定です。`);
  }

  const langObj = locales[lang];
  if (!langObj) {
    reportError(`locales.json 内に言語 "${lang}" の定義が見つかりません。`);
  }

  const message = path.split('.').reduce((obj, key) => obj?.[key], langObj);

  if (!message) {
    reportError(`キー "${path}" は、locales.json の "${lang}" 内に定義されていません。`);
  }
  
  return message;
}

// 共通のエラー報告関数
function reportError(msg) {
  console.error(`\n❌ [i18nエラー]: ${msg}`);
  process.exit(1); // ここでプロセスを殺すことで、Bunにビルド失敗を即座に伝える
}

