// build.ts
const { spawnSync } = Bun;const langs = ["ja", "en"];
for (const lang of langs) {
  const result = spawnSync({
    cmd: ["bun", "build", "./src/index.js", "--outfile", `./dist/code.${lang}.js`],
    env: { ...process.env, APP_LANG: lang },
  });

  const stderr = result.stderr.toString();

  // マクロがエラーを吐いた、もしくはビルド自体に失敗した場合
  if (!result.success || stderr.includes("__I18N_ERROR__")) {
    console.error(`\n❌ ビルド失敗: ${lang}`);

    // マクロからのエラー情報を解析
    const errorMatch = stderr.match(/__I18N_ERROR__:(.+):(.+)/);
    if (errorMatch) {
      const [_, path, errorLang] = errorMatch;
      console.error(`\n❌ [i18nエラー]: キー "${path}" は、locales.json の "${errorLang}" 内に定義されていません。`);
    }

    // Bun標準のエラー（行数・ファイル名・コードのプレビュー）を表示
    // 不要な独自フラグなどは除いて表示
    console.error(stderr.replace(/__I18N_ERROR__:.*\n/g, ""));
    process.exit(1);
  }
  console.log(`✅ ビルド完了: code.${lang}.js`);
}
