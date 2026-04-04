// build.ts
const { spawnSync } = Bun;const langs = ["ja", "en"];
for (const lang of langs) {
  const result = spawnSync({
    // 'command' ではなく 'cmd' が正解です
    cmd: ["bun", "build", "./src/index.js", "--outfile", `./dist/code.${lang}.js`],
    env: {
      ...process.env,
      APP_LANG: lang,
    },
  });

  if (!result.success) {
    console.error(`❌ ビルド失敗: ${lang}`);
    console.error(result.stderr.toString());
    process.exit(1);
  }
  console.log(`✅ ビルド完了: code.${lang}.js`);
}

