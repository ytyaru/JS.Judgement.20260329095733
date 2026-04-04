// build.ts
const langs = ["ja", "en"];
for (const lang of langs) {
  await Bun.build({
    entrypoints: ["./src/index.js"],
    outdir: "./dist",
    naming: `code.${lang}.js`,
    // マクロに言語を伝えるために環境変数を渡す
    define: {
      "process.env.APP_LANG": JSON.stringify(lang),
    },
  });
  console.log(`✓ Built: code.${lang}.js`);
}


