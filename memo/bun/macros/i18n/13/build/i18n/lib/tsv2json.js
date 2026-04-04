import fs from "node:fs";
import path from "node:path";

export function generateI18nJson(dir) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".tsv"));
  const data = {};

  if (files.length === 0) {
    console.error(`❌ [tsv2json]: ${dir} 内に .tsv ファイルが見つかりません。`);
    process.exit(1);
  }

  for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file), "utf-8");
    // i18n.err.msg.tsv -> ["err", "msg"]
    const parts = file.split('.');
    const hierarchy = parts.slice(1, -1);
    
    const lines = content.split(/\r?\n/).filter(l => l.trim() && !l.startsWith('#'));
    const header = lines.shift().split('\t');
    const langs = header.slice(1);

    lines.forEach(line => {
      const [key, ...values] = line.split('\t');
      langs.forEach((lang, i) => {
        if (!data[lang]) data[lang] = {};
        let current = data[lang];
        
        hierarchy.forEach(h => {
          if (!current[h]) current[h] = {};
          current = current[h];
        });
        current[key] = values[i]?.trim() || "";
      });
    });
  }

  const jsonPath = path.join(dir, "i18n.json");
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
  console.log(`✅ i18n.json を更新しました: ${jsonPath}`);
  return data;
}
