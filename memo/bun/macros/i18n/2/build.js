// build.ts
const langs = ["ja", "en"];
for (const lang of langs) {
  const result = await Bun.build({
    entrypoints: ["./src/index.js"],
    outdir: "./dist",
    naming: `code.${lang}.js`,
    // マクロに言語を伝えるために環境変数を渡す
    define: {
      "process.env.APP_LANG": JSON.stringify(lang),
    },
  });
  if (!result.success) {
    console.error(`ビルド失敗: ${lang}`);
    process.exit(1);
  }
  console.log(`✅ ビルド完了: code.${lang}.js`);
}
