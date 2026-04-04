const { spawnSync } = Bun;const langs = ["ja", "en"];
for (const lang of langs) {
  const result = spawnSync({
    cmd: ["bun", "build", "./src/index.js", "--outfile", `./dist/code.${lang}.js`],
    env: { ...process.env, APP_LANG: lang },
  });

  if (!result.success) {
    console.error(`❌ ビルド失敗: ${lang}`);
    // Bunが標準で出力する「行数・パス・エラー内容」をすべて表示
    console.error(result.stderr.toString().trim());
    process.exit(1);
  }
  console.log(`✅ ビルド完了: code.${lang}.js`);
}
