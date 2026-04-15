/**
 * ES6 class構文またはネイティブコンストラクタ関数であるかを判定する
 */
const isStrictConstructor = (v) => {
  if (typeof v !== 'function') return false;

  const str = Function.prototype.toString.call(v);

  // 1. ネイティブ関数の判定
  if (str.includes('[native code]')) {
    return v.prototype !== undefined && !v.name.startsWith('bound ');
  }

  // 2. ユーザー定義コードの判定
  // - 全てのコメントを「単一のスペース」に置換（改行を跨ぐ/* */も、行末の//も一掃する）
  // - 連続する空白を1つにまとめる
  const cleanStr = str
    .replace(/\/\*[\s\S]*?\*\//g, ' ') // マルチラインコメント削除
    .replace(/\/\/.*/g, ' ')           // シングルラインコメント削除
    .trim();

  // 行頭が class キーワードで始まっているか
  return /^class\b/.test(cleanStr);
};

