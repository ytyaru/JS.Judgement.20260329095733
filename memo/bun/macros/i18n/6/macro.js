import locales from "./locales.json" with { type: "json" };
export function t(path) {
  const lang = process.env.APP_LANG;
  const message = path.split('.').reduce((obj, key) => obj?.[key], locales[lang]);

  if (!message) {
    throw new Error(`[i18n] Key "${path}" not found for "${lang}"`);
  }
  // 文字列を返す。Bun build はこれを直接ソースコードに埋め込む
  return message;
}

