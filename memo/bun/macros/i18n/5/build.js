// build.ts
import locales from "./locales.json" with { type: "json" };
const langs = ["ja", "en"];
for (const lang of langs) {
  await Bun.build({
    entrypoints: ["./src/index.js"],
    outdir: "./dist",
    naming: `code.${lang}.js`,
    plugins: [{
      name: "i18n-plugin",
      setup(build) {
        // "i18n" という名前のインポートを検知したら、中身を動的に生成する
        build.onResolve({ filter: /^i18n$/ }, args => ({ path: args.path, namespace: "i18n-ns" }));
        build.onLoad({ filter: /.*/, namespace: "i18n-ns" }, () => {
          // ここで、現在の言語(lang)に基づいたt関数を文字列として生成
          const t_function = `
            const data = ${JSON.stringify(locales[lang])};
            export function t(path) {
              return path.split('.').reduce((obj, key) => obj?.[key], data) || path;
            }
          `;
          return { contents: t_function, loader: "js" };
        });
      },
    }],
  });
  console.log(`✅ ビルド完了: code.${lang}.js`);
}
