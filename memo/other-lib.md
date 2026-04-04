# judgement.js作成にあたり欲しくなった依存ライブラリ達

それらは既存ではなく未だ存在しない新しいライブラリだ。それらを本案件とは別に実装し、それらに依存した形でjudgement.jsを実装し直せば、重複コードを排除したDRYなライブラリに再編できる。

私が考えている新依存ライブラリは以下だ。

* err.js
* typis.js
* decolass.js

## judgement.jsに存在する重複コード

Judgement.jsに存在する重複コードは以下3箇所だ。

1. エラー定義
2. 型チェック
3. スーパークラス・デコレーション

### 1. エラー定義

```javascript
// 以下の独自例外型定義は同じ構造のものばかり。DRYに書けるはずだが、それ専用の別ライブラリに書くべきだ。
class ImplementationError extends Error {
    constructor(msg, cause) {
        super(msg, cause ? {cause} : undefined);
        this.name = 'ImplementationError';
    }
}
class JudgementError extends Error {
    constructor(msg, cause) {
        super(msg, cause ? {cause} : undefined);
        this.name = 'JudgementError';
    }
}
class JudgementImplementationError extends Error {
    constructor(msg, cause) {
        super(msg, cause ? {cause} : undefined);
        this.name = 'JudgementImplementationError';
    }
}
class JudgementAsyncError extends Error {
    constructor(msg, cause) {
        super(msg, cause ? {cause} : undefined);
        this.name = 'JudgementAsyncError';
    }
}
class JudgementResultError extends Error {
    constructor(msg, cause) {
        super(msg, cause ? {cause} : undefined);
        this.name = 'JudgementResultError';
    }
}
class JudgementFailError extends Error {
    constructor(msg, cause) {
        super(msg, cause ? {cause} : undefined);
        this.name = 'JudgementFailError';
    }
}
```

以下のようなAPIを実装しようと思っている。

```javascript
class Err {
    regist(...defines) {}       // 指定した名前で動的生成された例外クラスをglobalThisに登録する
    make(...defines) {}         // 指定した名前で例外クラスを動的生成する
    new(type, msg, cause) {}    // 引数を組み立てて例外インスタンスを生成する({cause:}と書くのがウザいので)
    throw(...args) {}           // 三項演算子時に(()=>{throw new Error})()と書くのがウザいのでメソッド化する
}
Err.regist('JudgementError', 'JudgementImplementationError JudgementError', ...); // make()したものをglobalThisに登録する
const {JudgementError, JudgementImplementationError} = Err.make('JudgementError', 'JudgementImplementationError JudgementError', ...); // 指定した名前のクラスを動的生成する。
Err.new(TypeError, `メッセージ`, causeError); // new TypeError(`メッセージ`, {cause:causeError})を返す
Err.throw(TypeError, `メッセージ`, causeError); // throw new TypeError(`メッセージ`, {cause:causeError})する
Err.throw(new TypeError(`メッセージ`, {cause:causeError}));
```

### 2. 型チェック

```javascript
// 以下共通関数たちはほぼすべて型チェックだ。汎用性が高く、他のライブラリでも使う。別案件として実装すべきだ。
const isFn = (v) => 'function'===typeof v
    , throwFn = (v, n) => {if (!isFn(v)) {throw new TypeError(`${n}は関数であるべきです。`)}}
    , isPms = (v) => v instanceof Promise
    , throwFnOrPromise = (v, n) => {if (!isFn(v) && !isPms(v)) {throw new TypeError(`${n}は関数またはPromiseであるべきです。`)}}
    , AsyncFunction = Object.getPrototypeOf(async function(){}).constructor
    , GeneratorFunction = Object.getPrototypeOf(function*(){}).constructor
    , AsyncGeneratorFunction = Object.getPrototypeOf(async function*(){}).constructor
    , isAFn = (v) => v instanceof AsyncFunction
    , isNormalFn = (v) => isFn(v) ? !(v instanceof GeneratorFunction || v instanceof AsyncGeneratorFunction) : false
    , throwFnOrAFn = (v, n) => {if (!isNormalFn(v)) {throw new TypeError(`${n}は通常の関数（同期または非同期）であるべきです。ジェネレータは許可されません。`);}}
    , isStr = (v) => 'string'===typeof v
    , isInt = (v) => Number.isSafeInteger(v)
    , judActs = Object.freeze({mix:0, throw:1, at:2})
    , isErrIns = (v) => v instanceof Error
    , getId = (v) => Object.prototype.toString.call(v).slice(8,-1)
;
```

以下のようなAPIを実装しようと思っている。

```javascript
typis(target); // (v) => Object.prototype.toString.call(v).slice(8,-1) を返す
typis(target, a=>a.primitive.number.integer.positive); // targetが第二引数で指定した型であるか真偽値で返す
typis(target, Number); // 確認すべき型の指定をクラス(コンストラクタ)で指定した版
```

### 3. スーパークラス・デコレーション

```javascript
// 以下、isPass, judge()などのディスクリプタやメソッドは、スーパークラスにデコレーションしただけで、それ以外はまったく同じだ。DRYに書けるはずだ。
class AsyncJudgement extends SyncJudgement {
    constructor(fn, failedAct=Judgement.mix, res) {super(fn, failedAct, res)}
    // JavaScriptエンジンが await 時に自動で呼ぶ魔法のメソッド
    async then(resolve, reject) {// Thenable Object
        try {
            const actualRes = await this._.res;
            this._validResult(actualRes);
            this._.res = actualRes;
            Object.defineProperty(this, 'then', { value: undefined });
            resolve(this);
        } catch (e) {reject(e);}
    }
    #throwPms(s) {if(isPms(this._.res)){throw new JudgementAsyncError(`${s}を呼び出す前にawaitすべきです。`)}}
    get isPass() {this.#throwPms('isPass'); return super.isPass;}
    get isFail() {this.#throwPms('isFail'); return super.isFail;}
    // judge()呼出時のコールバック関数やデフォルト値の設定（メソッドチェーン）
    onPass(cb) {this.#throwPms('onPass()'); return super.onPass(cb);}
    onAt(cb) {this.#throwPms('onAt()'); return super.onAt(cb);}
    onThrow(cb) {this.#throwPms('onThrow()'); return super.onThrow(cb);}
    // 結果確定（実装任せ／例外発生／値返却）
    judge() {this.#throwPms('judge()'); return super.judge();}
    throw(fn) {this.#throwPms('throw()'); return super.throw(fn);}
    at(v) {this.#throwPms('at()'); return super.at(v);}
}
```

以下のようなAPIを実装しようと思っている。

```javascript
decolass(AsyncJudgement, (propName)=>{任意処理});
```
```javascript
class AsyncJudgement extends SyncJudgement {
    static {
        // isPass, isFail, onPass, onThrow, onAt, judge, throw, at
        decolass(AsyncJudgement, (name)=>this.#throwPms(name));
    }
    static #throwPms(s) {if(isPms(this._.res)){throw new JudgementAsyncError(`${s}を呼び出す前にawaitすべきです。`)}}
    constructor(fn, failedAct=Judgement.mix, res) {super(fn, failedAct, res)}
    // JavaScriptエンジンが await 時に自動で呼ぶ魔法のメソッド
    async then(resolve, reject) {// Thenable Object
        try {
            const actualRes = await this._.res;
            this._validResult(actualRes);
            this._.res = actualRes;
            Object.defineProperty(this, 'then', { value: undefined });
            resolve(this);
        } catch (e) {reject(e);}
    }
}
```

ようするに渡したクラスの親が持つcallableなもの（コンストラクタを除いた全メソッドとゲッターとセッター）を網羅し、それをオーバーライドする糖衣構文だ。恐らく用途は限定的だ。普通は全要素に対して共通の処理などしないだろうから。もしdecolassを一般化するならば、指定した属性（メソッド／ゲッター／セッター）や、指定したプロパティ名に対して、指定したコールバック関数を差し込むという形にするのが良いだろう。

```javascript
const d = new Decolass(AsyncJudgement);
decolass.onConstructor((propName)=>{任意処理});
decolass.onMethod((propName)=>{任意処理});
decolass.onGetter((propName)=>{任意処理});
decolass.onSetter((propName)=>{任意処理});
decolass.onAccessor((propName)=>{任意処理});    // getter/setter両方
decolass.onDescriptor((propName)=>{任意処理});  // アクセサ／データ両方(但しデータのほうはvalueがcallableのみ)
decolass.on('propName', (propName)=>{任意処理});
```
```javascript
// 第二引数でセットした属性のすべてのプロパティに対して、第三引数で指定したコールバック関数を差し込む
Decolass.on(AsyncJudgement, t=>t.method.getter, (propName)=>{任意処理});
```

## 構造と最適化

上記3依存ライブラリを作成し、judgement.jsに適用すれば、DRYに書けて保守性も高まる。

反面、依存するからスタンドアロンではなくなってしまう。ファイルサイズも増えるだろう。judgement.jsさえ使えれば良いのであれば冗長になる可能性もある。だが、上記3ライブラリはJSの言語欠陥を補うレベルの代物なので、汎用性は高い。decolassだけは微妙だが。他にも使う箇所があれば、総合的には重複コードが消えてファイルサイズは減り、統一APIで実装できて保守性や可読性が高まるはずだ。

最終的に、どのようなファイル構造にするか。これはいくつものパターンがある。

* プログラミング言語(JS/TS)
* 実行環境(bun/node/deno/browser)
* モジュール(ESM/ClassicScript)
* ライブラリ依存(Dependence(依存)/Independence(自立))
* 実装戦略(保守性／実行効率)
* エラーメッセージ自然言語(英語／日本語)
* ログ(consoleのinfo/warn/error以外削除／全部残す)  これは無くてもいいかな？
* ミニファイ(する／しない)

```
プログラミング言語(1) * 環境(4) * モジュール(2) * 依存(2) * 実装(2) * メッセージ言語(2) * ミニファイ(2)
= 1 * 4 * 2 * 2 * 2 * 2 * 2
= 128 通り
```

ディレクトリ構造は以下のようになるか。

```tree
judgement/
    dist/
        js/
            bun/
                module/
                    dependence/
                        maintainability/
                            min/
                                judgement.en.js
                                judgement.ja.js
                            max/
                                judgement.en.js
                                judgement.ja.js
                        efficiency/
                    independence/
                        同上
                script/
                    同上
            node/
                同上
            deno/
                同上
            browser/
                同上
    test/
        同上
    src/
        js/
            bun/
                dependence/
                    maintainability/
                        judgement.js
                    efficiency/
                        judgement.js
                independence/
                    maintainability/
                        judgement.js        今書いているのはこれ
                    efficiency/
                        judgement.js
```

128はjsファイルの数になる。なぜたった一つの役割を持ったjudgement.jsというファイルに、128ものパターンが必要なのか。すべてはJSがインタプリタ言語によるものでありコンパイラ言語のように自動で最適化してくれない欠陥言語であることに起因する。

実際は128より減らせると思う。例えば実行環境がbunならばESMだけで良い。恐らくDenoも同じだ。すると`dist/`で出力すべきjsファイル数は環境ごとに計測して96通りにまで減らせる。まだまだ多すぎるのだが。仕方ない。

```
bun(16)+deno(16)+node(32)+browser(32)
=96通り
```

詳細化すると以下。

```tree
judgement/
    README.md
    LICENSE.md
    build.sh
    test.sh
    docs/
        index.html
        intro/
        example/
        api/
    dist/
        js/
            bun/    16
                module/
                    dependence/
                        maintainability/
                            min/
                                judgement.en.js
                                judgement.ja.js
                            max/
                                judgement.en.js
                                judgement.ja.js
                        efficiency/
                            min/
                                judgement.en.js
                                judgement.ja.js
                            max/
                                judgement.en.js
                                judgement.ja.js
                    independence/
                        maintainability/
                            min/
                                judgement.en.js
                                judgement.ja.js
                            max/
                                judgement.en.js
                                judgement.ja.js
                        efficiency/
                            min/
                                judgement.en.js
                                judgement.ja.js
                            max/
                                judgement.en.js
                                judgement.ja.js
            node/   32
                module/
                    dependence/
                        maintainability/
                            min/
                                judgement.en.js
                                judgement.ja.js
                            max/
                                judgement.en.js
                                judgement.ja.js
                        efficiency/
                            min/
                                judgement.en.js
                                judgement.ja.js
                            max/
                                judgement.en.js
                                judgement.ja.js
                    independence/
                        maintainability/
                            min/
                                judgement.en.js
                                judgement.ja.js
                            max/
                                judgement.en.js
                                judgement.ja.js
                        efficiency/
                            min/
                                judgement.en.js
                                judgement.ja.js
                            max/
                                judgement.en.js
                                judgement.ja.js
                script/
                    dependence/
                        maintainability/
                            min/
                                judgement.en.js
                                judgement.ja.js
                            max/
                                judgement.en.js
                                judgement.ja.js
                        efficiency/
                            min/
                                judgement.en.js
                                judgement.ja.js
                            max/
                                judgement.en.js
                                judgement.ja.js
                    independence/
                        maintainability/
                            min/
                                judgement.en.js
                                judgement.ja.js
                            max/
                                judgement.en.js
                                judgement.ja.js
                        efficiency/
                            min/
                                judgement.en.js
                                judgement.ja.js
                            max/
                                judgement.en.js
                                judgement.ja.js
            deno/   16
                module/
                    dependence/
                        maintainability/
                            min/
                                judgement.en.js
                                judgement.ja.js
                            max/
                                judgement.en.js
                                judgement.ja.js
                        efficiency/
                            min/
                                judgement.en.js
                                judgement.ja.js
                            max/
                                judgement.en.js
                                judgement.ja.js
                    independence/
                        maintainability/
                            min/
                                judgement.en.js
                                judgement.ja.js
                            max/
                                judgement.en.js
                                judgement.ja.js
                        efficiency/
                            min/
                                judgement.en.js
                                judgement.ja.js
                            max/
                                judgement.en.js
                                judgement.ja.js
            browser/    32
                module/
                    dependence/
                        maintainability/
                            min/
                                judgement.en.js
                                judgement.ja.js
                            max/
                                judgement.en.js
                                judgement.ja.js
                        efficiency/
                            min/
                                judgement.en.js
                                judgement.ja.js
                            max/
                                judgement.en.js
                                judgement.ja.js
                    independence/
                        maintainability/
                            min/
                                judgement.en.js
                                judgement.ja.js
                            max/
                                judgement.en.js
                                judgement.ja.js
                        efficiency/
                            min/
                                judgement.en.js
                                judgement.ja.js
                            max/
                                judgement.en.js
                                judgement.ja.js
                script/
                    dependence/
                        maintainability/
                            min/
                                judgement.en.js
                                judgement.ja.js
                            max/
                                judgement.en.js
                                judgement.ja.js
                        efficiency/
                            min/
                                judgement.en.js
                                judgement.ja.js
                            max/
                                judgement.en.js
                                judgement.ja.js
                    independence/
                        maintainability/
                            min/
                                judgement.en.js
                                judgement.ja.js
                            max/
                                judgement.en.js
                                judgement.ja.js
                        efficiency/
                            min/
                                judgement.en.js
                                judgement.ja.js
                            max/
                                judgement.en.js
                                judgement.ja.js

    test/
        同上
    src/
        js/
            bun/
                dependence/
                    maintainability/
                        judgement.js
                    efficiency/
                        judgement.js
                independence/
                    maintainability/
                        judgement.js        今書いているのはこれ
                    efficiency/
                        judgement.js
```

さて、常識的に考えて用途別に以下のようになるはずだ。

* 利用したい時はミニファイされた実行効率の高いコードを使う
* デバッグしたい時はミニファイされていない保守性の高いコードを使う

ということは、実装戦略(2)とミニファイ(2)は用途(2)に圧縮できるはずだ。

* プログラミング言語(JS/TS)
* 実行環境(bun/node/deno/browser)
* モジュール(ESM/ClassicScript)
* ライブラリ依存(Dependence(依存)/Independence(自立))
* 利用形態(release/debug)
    * 実装戦略(保守性／実行効率)
    * ミニファイ(する／しない)
* エラーメッセージ自然言語(英語／日本語)
* ログ(consoleのinfo/warn/error以外削除／全部残す)  これは無くてもいいかな？

パターン数の計算式は以下。48通りにまで圧縮できる。

```
esmOnly = mod(1) * dep(2) * use(2) * lang(2); // 8
hasScript = mod(2) * dep(2) * use(2) * lang(2); // 16
パターン数
= bun(esmOnly) + deno(esmOnly) + node(hasScript) + browser(hasScript)
= bun(8) + deno(8) + node(16) + browser(16)
= 8 + 8 + 16 + 16
= 48 通り
```

ところで、もしESMが使えるなら、実行環境ごとに違いなど無いはずでは？

Node/Deno/Bun/Browserという4つの実行環境がある。それぞれ固有APIがある。それを使わない場合に限り、ESMであれば共通コードに統一できるはずだ。そしてJudgementはJS言語標準だけで良く、各種環境用APIは使わずに済むはずだ。

* プログラミング言語(JS/TS)
* モジュール
    * ESM(bun/deno/node/browser)
    * ClassicScript(実行環境固有(node/browser))
* 利用形態(release/debug)
    * 実装戦略(保守性／実行効率)
    * ミニファイ(する／しない)
* ライブラリ依存(Dependence(依存)/Independence(自立))
* エラーメッセージ自然言語(英語／日本語)
* ログ(consoleのinfo/warn/error以外削除／全部残す)  これは無くてもいいかな？

```
mod = プログラミング言語(1) * モジュール(1(ESM))    * 依存(2) * 利用(2) * 言語(2) = 1*1*2*2*2 = 8;
old = プログラミング言語(1) * モジュール(1(Script)) * 依存(2) * 利用(2) * 言語(2) = 1*1*2*2*2 = 8;
全パターン = mod + old = 8 + 8 = 16 通り
```

16通りにまで減らせた。

```tree
judgement/
    README.md
    LICENSE.md
    build.sh
    test.sh
    docs/
        index.html
        intro/
        example/
        api/
    dist/
        js/
            esm/
                release/
                    dependence/
                        en/
                            lib/
                                err.js
                                typis.js
                                decolass.js
                            judgement.js
                        ja/
                            lib/
                                err.js
                                typis.js
                                decolass.js
                            judgement.js
                    independence/
                        en/
                            judgement.js
                        ja/
                            judgement.js
                debug/
                    dependence/
                        en/
                            lib/
                                err.js
                                typis.js
                                decolass.js
                            judgement.js
                        ja/
                            lib/
                                err.js
                                typis.js
                                decolass.js
                            judgement.js
                    independence/
                        en/
                            judgement.js
                        ja/
                            judgement.js
            script/     非ESMで環境固有(classic script)
                node/
                    dependence/
                        en/
                            lib/
                                err.js
                                typis.js
                                decolass.js
                            judgement.js
                        ja/
                            lib/
                                err.js
                                typis.js
                                decolass.js
                            judgement.js
                    independence/
                        en/
                            judgement.js
                        ja/
                            judgement.js
                browser/
                    dependence/
                        en/
                            lib/
                                err.js
                                typis.js
                                decolass.js
                            judgement.js
                        ja/
                            lib/
                                err.js
                                typis.js
                                decolass.js
                            judgement.js
                    independence/
                        en/
                            judgement.js
                        ja/
                            judgement.js
    test/
        同上
    src/
        js/
            esm/
                debug/
                    dependence/             lib/に依存したDRYな実装
                        en/
                            judgement.js
                        ja/
                            judgement.js
                    independence/           lib/に依存しない自己完結した重複コードのある実装
                        en/
                            judgement.js
                        ja/
                            judgement.js    今書いているのはこれ
    lib/                                    judgement.jsとは違う責任を持った別ライブラリ
        en/
            err.js
            typis.js
            decolass.js
        ja/
            err.js
            typis.js
            decolass.js
```

エンドユーザは4軸の2択、計16通りの中からjsファイルを選ぶことになる。

しかし多言語化については何かいいライブラリがありそうな気もするが。巷にあるライブラリは大げさすぎる。

キーワードでいえば`i18n`だ。これは国際化(Internationalization)の略だ。頭文字`i`と末尾`n`の間に18字のアルファベットがあることから`i18n`という名前になったようだ。これが完了すると次は`l10n`(地域化`Localization`)がある。特定の言語に合わせて実際に翻訳する仕事だ。これには`2nd`や`12/31/2025`など地域によって変わる書式も考慮すべきだろう。標準APIならIntlが担当するか。i18nとl10nを合わせて`g11n`(世界化`Globalization`)という言葉があるらしい。

さて、私が希望していたのは単純だ。例外発生時のエラーメッセージを多言語化したい。日本語と英語の二言語だけで十分だろう。

問題は、その言語情報を誰がどこまで持つべきかだ。

* 全言語をファイル内に持たせる（実行時に言語を切替可能）
* ファイルごとに単一言語のみ持たせる（JSファイル選択時に言語も選択する。その言語しか表示できない。その分ファイル容量が少ない）

実際は一つの言語であれば十分なはずだ。よって後者が望ましい。すると、コードを言語に応じて二種類書かねばならないことになる。ソースコードのうち、メッセージの言語を変えたい箇所だけ、別の言語に翻訳した文字列に置換する作業が発生する。そんなことを手動ではやりたくない。

```
new Error(`これはエラーメッセージです`); // 日本語版
```
```
new Error(`This is error message.`); // 英語版
```

なので、ソースコードのうち、言語を切り替えたい箇所だけ、特定

code.js
```
new Error(i18n.err.msg.e001); // エラーコードなどキーでメッセージを指定する
```

そして以下のようにシェルコマンドツールを作る。言語を指定して、入力と出力のファイルを指定する。これにてソースコードに指定キーと言語に該当する文字列が埋め込まれたソースコードファイルを出力するという仕組みだ。

```sh
i18n ja code.js code.ja.js
i18n en code.js code.en.js
```

置換すべきメッセージは以下のように実装することにする。

i18n.txt
```
key	ja	en
err.msg.e001	これはエラーメッセージです	This is error message.
```

ようするにこのツールは単なるテキスト置換ツールだ。多言語対応としての機能というよりは、特定の文字列を、特定のルールに基づいて特定の別文字列に置換するというツールだ。

1. `src/`では多言語化したい箇所にi18n.txtで定義したキーをセットする（この時点でJSファイルコードは`i18n`というキーワードが未定義なので参照エラーになる）
2. `i18n`コマンドツールを実行し、`src/`に多言語テキスト置換されたソースコードファイルを出力させる
3. 2のコードを実行することで動作するかテストする



私は今bunで小さなJSコードを開発しているが、エラーメッセージを日本語と英語に対応したJSファイルをそれぞれ出力したい。まさか手書きでコードを二つ用意するのもバカらしい。ヒューマンエラーも起こるだろうから自動化したい。この時、どのような実装方法が良いか考えた。大凡、以下の二通りあると思う。

1. JSで動作するライブラリ
2. テキスト置換ツール

1は全言語データがソースコードに含まってしまい冗長になる。言語切替可能という強みはあるものの、通常は母国語さえあれば良いため冗長な場合がほとんどだ。

2はC言語のプリプロセッサ`#define`のようなもの。ソースコード自体のテキストを置換する。置換用キーワードが含まれた状態なのでJSエンジンで実行しようとするとReferenceErrorになる。つまりは中間ソースコードのようなものを作ることになる。

この二パターンしかないと思うが、合っているか？　合っているなら、前者1はブラウザでもすぐに使える軽量ライブラリを、後者2はシェルから実行できるツールを紹介して欲しい。他のパターンもあるなら、それも紹介して欲しい。


```
ご認識の通り、大きく分けて「実行時に解決するか」「ビルド時に解決するか」の2パターンですが、Bun環境であればその中間や、よりモダンな最適化手法も選択肢に入ります。
検討されている2つのアプローチに沿って、おすすめを紹介します。
------------------------------
## 1. JSで動作するライブラリ（実行時切り替え）
全言語が含まれてしまう懸念については、「必要な言語ファイルだけを動的にインポートする」手法で解決するのが一般的です。

* おすすめ: i18next
* 特徴: JS界のデファクトスタンダード。非常に多機能ですが、コアは軽量です。
   * 冗長性の解決: i18next-http-backend（ブラウザ用）や動的 import() を使うことで、ユーザーの言語設定に合わせたJSONファイルのみを後読みできます。
   * ブラウザでの利用: CDN経由でも、Bunでビルドして1つのJSにまとめる形でも動作します。

## 2. テキスト置換ツール（ビルド時固定）
Cのプリプロセッサのように、ビルド時に特定の言語を埋め込んだJSファイルを別々に出力（app.en.js, app.jp.js）する方法です。

* おすすめ: esbuild の define ＋ Bun.build
* 方法: コード内では process.env.MSG_HELLO のような変数、あるいは独自の定数（例: __GREETING__）を書いておきます。
   * 実行: Bunのビルダー実行時に、環境変数や define オプションで言語データを流し込みます。
   * 利点: 実行時のオーバーヘッドがゼロになり、コード内に他言語が混入しません。

------------------------------
## 3. 第3の選択肢：静的解析・型安全なアプローチ（推奨）
今のBun開発において、手書きのミスを防ぎつつ、最も効率が良いのは「i18nライブラリを使いつつ、ビルド時に最適化（Tree-shaking）する」方法です。

* おすすめ: unplugin-i18n (Intlify系) または 自作マクロ
* Bunには Bun Macros という強力な機能があります。
   * 仕組み: コンパイル時にJS関数を実行して結果をインライン展開します。
   * メリット: ソースコード上は getMsg('hello') と書くだけ。ビルド時にそれを "こんにちは" という文字列に直接置き換えて出力できます。ReferenceErrorも起きず、中間ファイル管理の苦労もありません。

------------------------------
## 結論としての提案

* 「とにかく手軽に、ブラウザでサクッと動かしたい」
→ i18next を使い、言語ファイルを fetch で後読みする。
* 「ファイルサイズを最小化し、言語ごとのJSを書き出したい」
→ Bun.build の define 機能を使い、シェルスクリプトから LANG=ja bun build ... をループで回す。

現在、Bunのビルドスクリプト（build.tsなど）をすでに書いていますか？それとも、単純なシェルコマンドでの解決を望まれますか？
```

3の方法が良さそう。`bun build`時に実行して多言語用コードを作成するマクロを作るって感じか？

src/code.js
```
const throw = ()=> new Error(i18n.err.msg.e001); // エラーコードなど任意のキーでメッセージを指定する
```

これを以下のようなコードにしたい。

dist/code.ja.js
```
const throw = ()=> new Error(`これはエラーメッセージです`); // 日本語版
```
dist/code.en.js
```
const throw = ()=> new Error(`This is error message.`); // 英語版
```

必要になるのは翻訳データファイルか。

i18n.ja.js
```json
{
    err:{
        msg:{
            e001: `これはエラーメッセージです`
        }
    }
}
```

i18n.en.js
```json
{
    err:{
        msg:{
            e001: `This is error message.`
        }
    }
}
```

以下のような重複コードのある2ファイルを書かねばならないってこと？

src/code.ja.js
```
import { i18n } from "./i18n.ja.js" with { type: "macro" };
new Error(i18n.err.msg.e001); // エラーコードなど任意のキーでメッセージを指定する
```

src/code.en.js
```
import { i18n } from "./i18n.en.js" with { type: "macro" };
new Error(i18n.err.msg.e001); // エラーコードなど任意のキーでメッセージを指定する
```

そんで以下のように実行すれば良いのかな？

```sh
bun build src/code.ja.js --outfile=dist/code.ja.js
bun build src/code.en.js --outfile=dist/code.en.js
```

DRYに書けないのはダサくない？　それとも、何か他に良い書き方がある？

### AI解答

```markdown
確かにおっしゃる通り、言語ごとにエントリーポイント（code.ja.jsなど）を増やすのは「ダサい」ですし、管理が面倒です。
これを解決する最もDRYな方法は、「ソースコード（src/code.js）は1つ」に保ち、ビルド時に環境変数で言語を指定して差し替える手法です。
Bunのビルドスクリプト機能を使えば、以下のようにスマートに実装できます。
## 1. 翻訳データを用意する (locales.json)
1つのJSONにまとめておくと管理が楽です。

{
  "ja": { "e001": "これはエラーメッセージです" },
  "en": { "e001": "This is error message." }
}

## 2. マクロを作成する (macro.ts)
ビルド時に実行され、指定された言語の文字列を返します。

// macro.tsimport locales from "./locales.json";
export function t(key: string) {
  // 環境変数から言語を取得（ビルド時に決定される）
  const lang = process.env.APP_LANG || "ja";
  return locales[lang][key] || key;
}

## 3. ソースコードは1つだけ (src/index.js)
with { type: "macro" } を使ってインポートします。

import { t } from "./macro.ts" with { type: "macro" };
const throwErr = () => {
  throw new Error(t("e001"));
};

## 4. ビルドスクリプトで一括出力 (build.ts)
ここが肝です。ループを回して、環境変数を変えながらビルドを実行します。

// build.tsconst langs = ["ja", "en"];
for (const lang of langs) {
  await Bun.build({
    entrypoints: ["./src/index.js"],
    outdir: "./dist",
    naming: `code.${lang}.js`,
    // マクロに言語を伝えるために環境変数を渡す
    env: {
      APP_LANG: lang,
    },
  });
  console.log(`✓ Built: code.${lang}.js`);
}

## 実行方法
あとはこのビルド用JSを叩くだけです。

bun run build.ts

## この方法のメリット

* DRY: ロジック（src/index.js）は1つだけ。
* ゼロ・オーバーヘッド: 出力されたJSには t("e001") という関数呼び出しすら残らず、"これはエラー..." という生の文字列が埋め込まれます。
* 型安全: TypeScriptを使えば、マクロ内でキーが存在するかチェックしてビルドエラーにすることも可能です。

まずはこの 「ビルドスクリプトによるループ実行」 を試してみるのはいかがでしょうか？
```


おお、いいね。でも実行すると以下エラーが出た。

```sh
$ bun run build.ts
1 | // build.ts
2 | const langs = ["ja", "en"];
3 | for (const lang of langs) {
4 |   await Bun.build({
                ^
TypeError: env must be 'inline', 'disable', or a string with a '*' character
 code: "ERR_INVALID_ARG_TYPE"

      at /tmp/work/JS.Judgement.20260329095733/memo/bun/macros/i18n/0/build.ts:4:13
      at loadAndEvaluateModule (2:1)

Bun v1.3.11 (Linux arm64)
```

### AI解答

```markdown
申し訳ありません！エラーの原因は、BunのBun.buildにおけるenvオプションの使い方が、私の提示したコード（環境変数を直接オブジェクトで渡す書き方）と異なっていたためです。
Bun v1.x の env オプションは、「どの環境変数をインライン化するか」のルール（'inline' や 'disable' など）を指定するためのもので、値そのものを注入する場所ではありません。
マクロへ動的に値を渡すには、define オプションを使うのが正解です。
## 修正後のコード## 1. ビルドスクリプト (build.ts)
define を使って、コード上の process.env.APP_LANG という文字列を、ビルド時に特定の文字列（"ja" など）へ強制置換します。

// build.tsconst langs = ["ja", "en"];
for (const lang of langs) {
  await Bun.build({
    entrypoints: ["./src/index.js"],
    outdir: "./dist",
    naming: `code.${lang}.js`,
    // ここでコード内の process.env.APP_LANG を置換する
    define: {
      "process.env.APP_LANG": JSON.stringify(lang),
    },
  });
  console.log(`✓ Built: code.${lang}.js`);
}

## 2. マクロ (macro.ts)
マクロ側は変更不要です。ビルド時に process.env.APP_LANG が "ja" や "en" に置き換わった状態で実行されます。

import locales from "./locales.json";
export function t(key: string) {
  const lang = process.env.APP_LANG || "ja";
  // @ts-ignore
  return locales[lang]?.[key] || key;
}

## なぜこれで動くのか

   1. Bun.build が src/index.js を読み込む。
   2. マクロ t("e001") を見つける。
   3. define 設定により、マクロ内の process.env.APP_LANG が "ja" に書き換わる。
   4. マクロが実行され、結果の文字列 "これはエラー..." が t("e001") の位置に直接埋め込まれる。

これで、ソースコードを汚さずにDRYな多言語ビルドができるはずです。
もし特定の エラーメッセージ用のJSON構造（階層が深いものなど）をそのまま使いたい場合は、マクロ内の locales[lang][key] の探索ロジックを少し調整するだけで対応可能です。試してみてください！
build.ts を実行して、dist/ 配下に期待通りのファイルが生成されましたか？


```

> マクロ側は変更不要です。

って言ってるけど、以下の箇所が変わってる。`?`と`// @ts-ignore`が追加されている。

```
  // @ts-ignore
  return locales[lang]?.[key] || key;
```

もし未定義のキーが指摘されたらどうするか？　という話だな？　これはbun buildでマクロ実行された時、例外発生させ、シェルに分かりやすいメッセージを出したい。「i18nマクロ実行時エラーです。'〜'キーが未定義です。`locales.json``(対象JSファイルパス)`を見直してください。」のようなメッセージにしたい。

マクロ実行中に例外発生したらどうなるの？　ちゃんとシェルに出力されるの？

あとさ、JSコードはJavaScriptで書きたいんだけど、他のマクロやらビルドやらのコードはTSだよね？　JSではダメなの？

実行したら以下エラーだった。

```sh
$ bun run build.ts
1 | import { t } from "./macro.ts" with { type: "macro" };
                      ^
error: Macro "./macro.ts" not found
    at /tmp/work/JS.Judgement.20260329095733/memo/bun/macros/i18n/0/src/index.js:1:19

3 |   throw new Error(t("e001"));
                      ^
error: "MacroNotFound" error in macro
    at /tmp/work/JS.Judgement.20260329095733/memo/bun/macros/i18n/0/src/index.js:3:19

Bun v1.3.11 (Linux arm64)
```

macroが無いってさ。いや有るよね？　

```sh
$ ls
build.ts  locales.json  macro.ts  src
```

あー、src/index.jsから見た時のパスが間違ってるんだわ。以下に修正した。

```
import { t } from "../macro.ts" with { type: "macro" };
```

成功したっぽい。

```
$ bun run build.ts
✓ Built: code.ja.js
✓ Built: code.en.js
```

だが出力ファイルの中身が空だった。なんでや？

```
dist/
    code.en.js
    code.ja.js
```

### AI解答

```markdown
お疲れ様です。いくつか重要なポイント（パスの問題、出力が空になる理由、JSでの記述、エラーハンドリング）を整理します。
## 1. 出力ファイルが空になる理由
Bunのビルダーは、デフォルトで「エントリーポイントから到達可能なコード（デッドコード・シェイキング）」を最適化します。
提示された src/index.js の例：

const throwErr = () => {
  throw new Error(t("e001"));
};

このコードは「関数を定義しているだけ」でどこからも実行（呼び出し）されていないため、Bunが「このコードは不要」と判断して削除してしまったのが原因です。
対策: テストとして、末尾で関数を呼び出すか、export してください。

export const throwErr = () => { ... }; // exportするか
throwErr(); // 実行するか

## 2. JavaScript (JS) で書きたい場合
マクロもビルドスクリプトも、すべて .js で書いて問題ありません。 Bunは標準でJSファイルをそのまま実行・ビルドできます。
※ただし、マクロ側で import locales from "./locales.json" を使う場合、ビルド設定やNode互換性の兼ね合いで型定義エラーが出ることがあるため、JSなら require か、単純に JSON.parse(readFileSync(...)) するのが確実です。
## 3. マクロ実行時のエラーハンドリング
マクロ内で throw new Error(...) すると、ビルドがその時点で止まり、ターミナルにそのメッセージが表示されます。
意図した通り「キーが未定義ならエラーにする」ロジックをJSで書くと以下のようになります：
macro.js

import locales from "./locales.json" with { type: "json" };
export function t(key) {
  const lang = process.env.APP_LANG || "ja";
  const message = locales[lang]?.[key];

  if (!message) {
    // ここで投げたエラーがビルド時のエラーメッセージになる
    throw new Error(
      `\n[i18nマクロエラー]: キー "${key}" が "${lang}" に未定義です。\nlocales.json を確認してください。`
    );
  }
  return message;
}

## 4. まとめ：JS版の構成
フォルダ構成はそのままで、拡張子を .js に統一した場合の build.js です。
build.js

const langs = ["ja", "en"];
for (const lang of langs) {
  const result = await Bun.build({
    entrypoints: ["./src/index.js"],
    outdir: "./dist",
    naming: `code.${lang}.js`,
    define: {
      "process.env.APP_LANG": JSON.stringify(lang),
    },
  });

  if (!result.success) {
    console.error(`Build failed for ${lang}`);
    for (const message of result.logs) {
      console.error(message);
    }
    process.exit(1);
  }
  console.log(`✓ Built: code.${lang}.js`);
}

これで bun run build.js を実行すれば、マクロがエラーの時にビルドを停止し、成功すれば中身の詰まったJSが書き出されるはずです。
出力された dist/code.ja.js を開いて、new Error("これはエラーメッセージです") のように文字列が直埋めされているか確認してみてください。
次に、翻訳データの階層構造（err.msg.e001 のようなドット区切り）をマクロでどう解析させるかについて解説が必要ですか？
```

## 1. 出力ファイルが空になる理由

OK。`export`を追加した。

## 2. JavaScript (JS) で書きたい場合

> ※ただし、マクロ側で import locales from "./locales.json" を使う場合、ビルド設定やNode互換性の兼ね合いで型定義エラーが出ることがあるため、JSなら require か、単純に JSON.parse(readFileSync(...)) するのが確実です。

ケチがつく可能性があるならTSのままでいいや。

ていうか`import`ってJSの機能だよね？　なぜJSでエラーになるんや。bunはそういう仕様ってことなのかな。`require`とかいうNode.js用のモジュール命令文も使えるの？　めちゃくちゃだな。

結局、どう書くのが最善なのか全然分からない。私はTypeScriptで型定義すると、JSよりも冗長になって可読性が低下し、保守性さえも失われると感じたことがあった。なので小規模ならTSでなくJSで書いたほうが良いと思っているのだが。

しかしJSのほうが面倒ならTSのままでも良い。どっちがいいやら。

## 3. マクロ実行時のエラーハンドリング

いいね。採用。

## 4. まとめ：JS版の構成

OK。そのように修正した。

## 実行

`bun run build.js`を実行すると成功した！

次に、src/index.jsを修正し、存在しないキーを渡して実行してみた。すると、全然違うエラーが出たんだが……。私が期待したのは「`\n[i18nマクロエラー]: キー "${key}" が "${lang}" に未定義です。\nlocales.json を確認してください。`」というメッセージなんだが。

```
$ bun run build.ts
3 |   throw new Error(t("e00X"));
                      ^
error: cannot coerce Exception (Cell) to Bun's AST. Please return a simpler type
    at /tmp/work/JS.Judgement.20260329095733/memo/bun/macros/i18n/1/src/index.js:3:19

Bun v1.3.11 (Linux arm64)
```

### AI解答

```markdown
結論から言うと、Bunのマクロは「実行に失敗したとき」ではなく「マクロが値を返さなかったとき（例外を投げたとき）」の挙動が少し特殊なのが原因です。
エラーの正体と、JSでの書き方、そして階層構造への対応を整理します。
## 1. 「cannot coerce Exception」エラーの理由
マクロ関数の中で throw new Error() をすると、Bunは「エラーオブジェクトそのもの」をソースコードに埋め込もうとして失敗します。
マクロがビルドを止めるには、単純な throw ではなく、console.error でメッセージを出してから process.exit(1) するのが、今のBun（v1.x系）では最も確実でクリーンな方法です。
## 2. JS vs TS の結論
JSでOKです。 混乱させてすみません。
BunはJSファイルをそのまま「モダンなJS（ES Modules）」として扱えるので、型定義が不要ならJSの方がスッキリします。import も普通に使えます。
## 3. 【完成版】DRYで階層構造にも対応した実装
キーを t("err.msg.e001") のようにドット区切りで指定できるよう、マクロを改良しました。
## macro.js

import locales from "./locales.json" with { type: "json" };
export function t(path) {
  const lang = process.env.APP_LANG || "ja";
  // ドット区切りの文字列を分解して、JSONの深い階層を探す
  const message = path.split('.').reduce((obj, key) => obj?.[key], locales[lang]);

  if (!message) {
    console.error(`\n❌ [i18nマクロエラー]: キー "${path}" が "${lang}" に未定義です。\nlocales.json を確認してください。`);
    process.exit(1); // これでビルドが止まり、シェルにエラーが伝わる
  }
  
  return message;
}

## src/index.js

import { t } from "../macro.js" with { type: "macro" };
export const throwErr = () => {
  throw new Error(t("err.msg.e001"));
};

## build.js

const langs = ["ja", "en"];
for (const lang of langs) {
  const result = await Bun.build({
    entrypoints: ["./src/index.js"],
    outdir: "./dist",
    naming: `code.${lang}.js`,
    define: {
      "process.env.APP_LANG": JSON.stringify(lang),
    },
  });

  if (!result.success) {
    // マクロ内の process.exit(1) でここに来る前に止まるが、念のため
    process.exit(1);
  }
  console.log(`✅ Built: code.${lang}.js`);
}

## なぜこれが「最善」か

* 可読性: JSなので型定義のノイズがなく、ロジックが追いやすい。
* 堅牢性: 存在しないキーを指定すると、ビルドが即座に止まり、あなたが設定したエラーメッセージがターミナルに出る。
* 柔軟性: err.msg.e001 のような深い階層も扱える。

これで、bun run build.js を実行して、期待通りのエラーメッセージが出るか、あるいは正しいJSが書き出されるか試してみてください。
次は、この構成で複数のJSファイルを一括ビルドしたい、などの要望はありますか？
```

コードをそのように修正して実行すると以下エラーが出た。

```sh
$ bun run build.js

❌ [i18nマクロエラー]: キー "err.msg.e001" が "ja" に未定義です。
locales.json を確認してください。
```

locales.jsonのほうはまだ修正していないからエラーが出るのは期待通り。ただ、`"ja" に未定義です。`とかいうメッセージが意味不明。多分「"ja"オブジェクトに未定義です」という意味だと思うが。

あと、そのキーを参照しているファイルが何であるかもちゃんと書き出すべきだ。つまり`src/index.js`というファイルがそのキーを参照しており、その何行何列目であるかまで出してくれると嬉しい。

これが修正できたら、次はエラーが出ずに成功するパターンの動作確認もしたいが、まだ早い。


### AI解答

```markdown
マクロ内で process.exit(1) を使うとビルドが強制終了するため、Bunのビルダーが本来持っている「どのファイルの何行目でエラーが起きたか」という親切なレポート機能までスキップされてしまいます。
これを解決するには、マクロ側で無理にプロセスを殺すのではなく、「ビルドエラーとして正しく認識されるメッセージ」を出しつつ、エラーメッセージをブラッシュアップする必要があります。
以下のように修正してください。
## 1. マクロの修正 (macro.js)
文言をわかりやすくし、エラーの投げ方を調整します。Error オブジェクトを投げるとAST（構文解析）エラーになるため、メッセージを直接 throw するか、独自の判定を持たせます。

import locales from "./locales.json" with { type: "json" };
export function t(path) {
  const lang = process.env.APP_LANG || "ja";
  // locales[lang] が存在しない場合の考慮も追加
  const langObj = locales[lang];
  
  if (!langObj) {
     throw new Error(`[i18n] locales.json 内に言語 "${lang}" の定義が見つかりません。`);
  }

  const message = path.split('.').reduce((obj, key) => obj?.[key], langObj);

  if (!message) {
    // 💡 あえて「値」を返さないことで、Bunに「マクロの実行失敗」を通知させます
    // メッセージに [i18n] と付けておくと判別しやすくなります
    const errorMsg = `\n[i18n Error]: キー "${path}" は、locales.json の "${lang}" オブジェクト内に定義されていません。`;
    console.error(errorMsg);
    throw new Error(errorMsg); 
  }
  
  return message;
}

## 2. ビルドスクリプトの修正 (build.js)
Bun.build の戻り値である result.logs を詳しく出力するようにします。これにより、Bunが自動で付与する 「どのファイルの何行目か」 という情報が表示されます。

const langs = ["ja", "en"];
for (const lang of langs) {
  const result = await Bun.build({
    entrypoints: ["./src/index.js"],
    outdir: "./dist",
    naming: `code.${lang}.js`,
    define: {
      "process.env.APP_LANG": JSON.stringify(lang),
    },
  });

  if (!result.success) {
    console.error(`\n--- Build Failed (${lang}) ---`);
    // Bunが持っているエラーログ（ファイル名や行数を含む）をすべて表示
    for (const log of result.logs) {
      console.error(log);
    }
    process.exit(1);
  }
  console.log(`✅ Built: code.${lang}.js`);
}

## 3. 実行結果のイメージ
この修正後に bun run build.js を実行すると、ターミナルには以下のような出力が出るはずです。

[i18n Error]: キー "err.msg.e001" は、locales.json の "ja" オブジェクト内に定義されていません。

--- Build Failed (ja) ---
error: "MacroNotFound" error in macro
  at /your/path/src/index.js:3:19

at src/index.js:3:19 のように、「どのファイルの何行目でそのマクロが呼ばれたか」 がBunの標準機能によって補完されます。
まずはこれで、「間違ったキーを入れた時に、ファイル名と行数がターミナルに出るか」 を確認してみてください。これが確認できたら、次は locales.json を正しく直して、中身が埋まったJSが書き出されるか見ていきましょう。
locales.json は、以前提示された階層（err -> msg -> e001）に合わせて修正する準備はできていますか？
```








実行すると以下のようなエラーメッセージが出た。これは期待通り。`locales.json`の`ja`にある`err.msg.e001`という箇所を特定できるし、`index.js:4:19`でもそのキーを指定してある箇所が分かる。`error: cannot coerce `とかいうくだりは意味不明だが。まあいいだろう。

```sh
$ bun run build.js

[i18n Error]: キー "err.msg.e001" は、locales.json の "ja" オブジェクト内に定義されていません。
4 |   throw new Error(t("err.msg.e001"));
                      ^
error: cannot coerce Exception (Cell) to Bun's AST. Please return a simpler type
    at /tmp/work/JS.Judgement.20260329095733/memo/bun/macros/i18n/3/src/index.js:4:19

Bun v1.3.11 (Linux arm64)
```

次にlocales.jsonを以下のように修正した。

```json
{
  "ja": {
    "err":{
      "msg":{
        "e001": "これはエラーメッセージです"
      }
    }
  },
  "en": {
    "err": {
      "msg": {
        "e001": "This is error message."
      }
    }
  }
}
```

以下のように実行し、成功。

```sh
$ bun run build.js
✅ ビルド完了: code.ja.js
✅ ビルド完了: code.en.js
```

だが出力結果をみると、どっちも日本語で出力されていた。なぜ？

多分だが、マクロの以下の箇所`|| "ja";`のせいだと思われる。不正時はちゃんと例外発生させるべきだろう。さもなくば、勝手に想定外の結果で成功したと嘘を付くことになる。

```
export function t(path) {
  const lang = process.env.APP_LANG || "ja";
```

本当にここが問題なのか。だとしても、どこがどうなってこうなったのか。それはさておき、macro.jsの上記コードで例外発生するようにすべきだ。

いやはや、問題だらけじゃないか。

```markdown
ご指摘の通り、「想定外の結果で成功したと嘘をつく」のは開発において最も避けるべき事態ですね。
なぜ両方「日本語」になったのか、そしてなぜマクロが環境変数を受け取れていないのか、原因と修正案を整理します。
## 1. なぜ両方「日本語」になったのか？
原因は、Bun.build の define がマクロの実行環境に波及していない ことにあります。

* define は「ビルドされるコード（index.js）」のテキストを置換しますが、「マクロ（macro.js）を動かすプロセス」そのものの環境変数は変えられません。
* そのため、マクロ内の process.env.APP_LANG は常に undefined となり、デフォルト値の "ja" が選ばれ続けていました。

## 2. マクロを「厳格」にする修正
「デフォルト値」を捨て、環境変数が無ければ即座にビルドを失敗させるようにします。
macro.js

import locales from "./locales.json" with { type: "json" };
export function t(path) {
  // デフォルト値 "ja" を削除。環境変数が空なら即エラー。
  const lang = process.env.APP_LANG;

  if (!lang) {
    const errorMsg = `\n[i18n Error]: 環境変数 "APP_LANG" が設定されていません。ビルドスクリプトを確認してください。`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  const langObj = locales[lang];
  if (!langObj) {
    const errorMsg = `\n[i18n Error]: locales.json 内に言語 "${lang}" の定義が見つかりません。`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  const message = path.split('.').reduce((obj, key) => obj?.[key], langObj);

  if (!message) {
    const errorMsg = `\n[i18n Error]: キー "${path}" は "${lang}" 内に未定義です。`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  
  return message;
}

## 3. ビルドスクリプトを「確実」にする修正
マクロに環境変数を伝えるには、define ではなく、process.env を直接書き換えてからビルドを実行するのが最も確実です。
build.js

const langs = ["ja", "en"];
for (const lang of langs) {
  // 💡 ここが重要：マクロ実行プロセス自体の環境変数を一時的に書き換える
  process.env.APP_LANG = lang;

  const result = await Bun.build({
    entrypoints: ["./src/index.js"],
    outdir: "./dist",
    naming: `code.${lang}.js`,
    // マクロを使う場合、define での注入は不要（プロセス変数を直接参照するため）
  });

  if (!result.success) {
    console.error(`\n❌ ビルド失敗: ${lang}`);
    for (const log of result.logs) console.error(log);
    process.exit(1);
  }
  console.log(`✅ ビルド完了: code.${lang}.js`);
}

## 4. なぜ cannot coerce Exception と出るのか？
補足ですが、このメッセージは「マクロが Error オブジェクトを返そうとした（投げた）」際に、Bunが 「エラーオブジェクトをJSのコードとしてどう書き出せばいいかわからない（文字列なの？数値なの？）」 と混乱して出すものです。
今回の修正で process.env.APP_LANG = lang; とすることで、マクロが正しく「文字列」を返すようになるため、成功時にはこのエラーは消えます。
この修正で、今度こそ code.en.js に英語が埋め込まれる はずです。試してみてください。
次は、翻訳データに動的な値（「こんにちは、${name}さん」のような変数）を埋め込みたい といったニーズはありますか？



```


```js
```

```sh
bun build code.js --outfile=dist/code.ja.js
bun build code.js --outfile=dist/code.en.js
```

なので、ソースコードのうち、言語を切り替えたい箇所だけ、特定









`bilingual`（バイリンガル。二言語を使いこなす事や人）という名前で自前で実装したほうが良いか？　あるいは`i18`



私が求めるのは、

