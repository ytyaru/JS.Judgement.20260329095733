import fs from "node:fs";import path from "node:path";
export function generateI18nJson(dir) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".tsv"));
  const data = {};
  let totalKeys = 0;

  for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file), "utf-8");
    const parts = file.split('.');
    const hierarchy = parts.slice(1, -1);
    
    // 空行を除外
    const allLines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    
    // 1. まずコメント行を完全に除外する前の「最初の行」をヘッダーとして試みる
    // もし1行目が # で始まっているなら、その # を除去してヘッダーにする
    let firstLine = allLines[0];
    if (!firstLine) continue;
    
    const headerLine = firstLine.startsWith('#') ? firstLine.slice(1).trim() : firstLine;
    const header = headerLine.split('\t');
    const langs = header.slice(1); // ja, en...

    if (langs.length === 0) {
      console.error(`\n❌ [i18nエラー]: ${file} の1行目に言語定義（ja, en等）が見つかりません。
形式例: #key\tja\ten`);
      process.exit(1);
    }

    // 2. 2行目以降から、# で始まらないデータ行のみを抽出
    const dataLines = allLines.slice(1).filter(l => !l.startsWith('#'));

    if (dataLines.length === 0) {
      console.warn(`⚠️ [tsv2json]: ${file} に翻訳データ（2行目以降の非コメント行）がありません。`);
      continue;
    }

    dataLines.forEach((line, index) => {
      const [key, ...values] = line.split('\t');
      if (!key) return;

      langs.forEach((lang, i) => {
        if (!data[lang]) data[lang] = {};
        let current = data[lang];
        
        hierarchy.forEach(h => {
          if (!current[h]) current[h] = {};
          current = current[h];
        });

        if (current[key] !== undefined) {
          console.error(`\n❌ [i18nエラー]: キー "${key}" が重複しています。
ファイル: ${file}
箇所の特定: ${hierarchy.join('.')}.${key}`);
          process.exit(1);
        }

        current[key] = values[i]?.trim() || "";
        totalKeys++;
      });
    });
  }

  if (totalKeys === 0) {
    console.error(`\n❌ [i18nエラー]: 翻訳データが空です。
TSVファイルの構成を確認してください：
1行目: #key[TAB]ja[TAB]en （列定義）
2行目以降: 001[TAB]こんにちは[TAB]Hello （データ行）
※行頭が # の行はコメントとして無視されます。`);
    process.exit(1);
  }

  const jsonPath = path.join(dir, "i18n.json");
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
  console.log(`✅ i18n.json を生成しました (${totalKeys} keys)`);
  return data;
}
