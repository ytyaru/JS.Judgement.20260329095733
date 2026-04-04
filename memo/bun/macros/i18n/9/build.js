// build.ts
const { spawnSync } = Bun;const langs = ["ja", "en"];
for (const lang of langs) {
  const result = spawnSync({
    cmd: ["bun", "build", "./src/index.js", "--outfile", `./dist/code.${lang}.js`],
    env: { ...process.env, APP_LANG: lang },
  });

  if (!result.success) {
    console.error(`\n❌ ビルド失敗: ${lang}`);
    // 💡 Bunが吐いたエラーログ（行数・パスを含む）をそのまま出すだけ
    console.error(result.stderr.toString());
    process.exit(1);
  }
  console.log(`✅ ビルド完了: code.${lang}.js`);
}
