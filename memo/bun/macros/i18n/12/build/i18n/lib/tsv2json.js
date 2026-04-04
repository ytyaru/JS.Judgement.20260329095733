import fs from "node:fs";
export function generateI18nJson(dir) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".tsv"));
  const data = {};

  for (const file of files) {
    const content = fs.readFileSync(`${dir}/${file}`, "utf-8");
    // ファイル名から階層を抽出 (i18n.err.msg.tsv -> ["err", "msg"])
    const hierarchy = file.split('.').slice(1, -1);
    
    const lines = content.split('\n').filter(l => l && !l.startsWith('#'));
    const header = lines.shift().split('\t'); // key, ja, en...
    const langs = header.slice(1);

    lines.forEach(line => {
      const [key, ...values] = line.split('\t');
      langs.forEach((lang, i) => {
        if (!data[lang]) data[lang] = {};
        let current = data[lang];
        
        // ネスト構造を作成
        hierarchy.forEach(h => {
          if (!current[h]) current[h] = {};
          current = current[h];
        });
        current[key] = values[i]?.trim();
      });
    });
  }
  fs.writeFileSync(`${dir}/i18n.json`, JSON.stringify(data, null, 2));
  return data;
}

