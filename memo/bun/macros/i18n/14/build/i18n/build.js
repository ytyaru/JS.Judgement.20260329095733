import { generateI18nJson } from "./lib/tsv2json.js";
import fs from "node:fs";
import path from "node:path";

const [rawSrcPath, outPattern] = Bun.argv.slice(2);

if (!rawSrcPath || !outPattern) {
  console.error("❌ 使用法: bun build.js <src> <out_pattern>");
  process.exit(1);
}

// 呼び出し元のカレントディレクトリ基準で絶対パス化する
const srcPath = path.resolve(process.env.INIT_CWD || ".", rawSrcPath);
const i18nDir = import.meta.dir;

// 1. JSON生成
console.log("--- 翻訳データの生成中 ---");
const i18nData = generateI18nJson(i18nDir);
const langs = Object.keys(i18nData);

// 2. 言語ごとにビルド
console.log("--- 各言語のビルドを開始 ---");
for (const lang of langs) {
  const finalOutPath = path.resolve(process.env.INIT_CWD || ".", outPattern.replace("{lang}", lang));
  
  fs.mkdirSync(path.dirname(finalOutPath), { recursive: true });

  const result = Bun.spawnSync({
    cmd: ["bun", "build", srcPath, "--outfile", finalOutPath],
    env: { ...process.env, APP_LANG: lang },
  });

  if (!result.success) {
    console.error(`\n❌ ビルド失敗: ${lang}`);
    console.error(result.stderr.toString().trim());
    process.exit(1);
  }
  console.log(`✅ 生成完了: ${finalOutPath}`);
}
