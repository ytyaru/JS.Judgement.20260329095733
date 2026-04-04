// build.ts
const langs = ["ja", "en"];
for (const lang of langs) {
  const result = await Bun.build({
    entrypoints: ["./src/index.js"],
    outdir: "./dist",
    naming: `code.${lang}.js`,
    define: {
      "process.env.APP_LANG": JSON.stringify(lang),
    },
  });
  if (!result.success) {
    console.error(`\nビルド失敗: ${lang}`);
    // Bunが持っているエラーログ（ファイル名や行数を含む）をすべて表示
    for (const log of result.logs) {
      console.error(log);
    }
    process.exit(1);
  }
  console.log(`✅ ビルド完了: code.${lang}.js`);
}
