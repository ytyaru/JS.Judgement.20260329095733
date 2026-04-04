// build.ts
const langs = ["ja", "en"];
for (const lang of langs) {
  // 💡 ここが重要：マクロ実行プロセス自体の環境変数を一時的に書き換える
  process.env.APP_LANG = lang;

  const result = await Bun.build({
    entrypoints: ["./src/index.js"],
    outdir: "./dist",
    naming: `code.${lang}.js`,
    // マクロを使う場合、define での注入は不要（プロセス変数を直接参照するため）
  });

  if (!result.success) {
    console.error(`\n❌ ビルド失敗: ${lang}`);
    for (const log of result.logs) console.error(log);
    process.exit(1);
  }
  console.log(`✅ ビルド完了: code.${lang}.js`);
}
