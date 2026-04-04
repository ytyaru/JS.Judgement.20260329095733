// build/i18n/build.js
import { generateI18nJson } from "./lib/tsv2json.js";
const { spawnSync } = Bun;
import fs from "node:fs";
import path from "node:path";
// 引数チェック
const [srcPath, outPattern] = Bun.argv.slice(2);
if (!srcPath || !outPattern) {
  console.error("Usage: bun build.js <src> <out_pattern>");
  process.exit(1);
}
// 1. JSON生成
const i18nData = generateI18nJson(import.meta.dir);
const langs = Object.keys(i18nData);
// 2. 言語ごとにビルド
for (const lang of langs) {
  // 出力パスの解決 (./dist/main.{lang}.js or ./dist/{lang}/main.js)
  const finalOutPath = outPattern.replace("{lang}", lang);
  
  // ディレクトリがなければ作成
  fs.mkdirSync(path.dirname(finalOutPath), { recursive: true });

  const result = spawnSync({
    cmd: ["bun", "build", srcPath, "--outfile", finalOutPath],
    env: { ...process.env, APP_LANG: lang },
  });

  if (!result.success) {
    console.error(`❌ ビルド失敗: ${lang}`);
    console.error(result.stderr.toString().trim());
    process.exit(1);
  }
  console.log(`✅ 生成完了: ${finalOutPath}`);
}
