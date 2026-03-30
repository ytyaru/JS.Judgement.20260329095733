class JudgementError extends Error {
    constructor(msg, cause) {
        super(msg, cause ? {cause} : undefined);
        this.name = 'JudgementError';
    }
}
const isFn = (v) => 'function'===typeof v
    , throwFn = (v, n) => {if (!isFn(v)) {throw new TypeError(`${n}は関数であるべきです。`)}}
;
class Judgement {
    // pass/fail()は new Judgement((p,f)=>p(v)) のようにするとPromise.resolve()APIと統一性を持たせられるかも？
    static pass(v) {return new Pass(v)}         // これは必要か？　コンストラクタだけで十分では？
    static fail(...v) {return new Fail(...v)}   // これは必要か？　コンストラクタだけで十分では？
    constructor(fn) {
        throwFn(fn, 'fn');
        const res = this.#callBackFn(fn);
        if (!(res instanceof JudgementResult)) {throw new TypeError(`fnの戻り値はPassかFailのいずれかであるべきです。`)}
        this._={fn:fn, res:res};
    }
    #callBackFn(fn) {try {return fn(...'pass fail'.split(' ').map(n=>Judgement[n]));} catch(e) {new JudgementError(`new Judgement(fn)のfnコールバック関数実行時に例外発生しました。内容を見直してください。`, e)}}
    get isPass() {return this._.res instanceof Pass}
    get isFail() {return this._.res instanceof Fail}
    get result() {return this._.res}    // これは必要か？　isPass/isFail/judge()/throw()/at()で十分では？
    judge(...args) {return this.isPass ? this._.res.value : this._.res.unwrap(...args)}
    throw(fn) {return this.isPass ? this._.res.value : this._.res.throw(fn)}
    at(v) {return this.isPass ? this._.res.value : this._.res.at(v)}
}
class JudgementResult {
    constructor(value) {this._={value}}
    get value() {return this._.value}
}
class Pass extends JudgementResult {constructor(v) {super(v)}}
class Fail extends JudgementResult {
    constructor(...args) {
        super(args); // argsは配列 [Error, -1] など
        if (0===args.length) {throw new TypeError(`Failの引数は一つ以上必要です。`)}
    }
    get candidates() {return [...this._.value]}
    get value() {return this.#value}
    get cause() {return this.#cause}
    get #first() {return this._.value[0]}
    get #value() {return this.#getTypedFirst(true)}
    get #cause() {return this.#getTypedFirst(false)}
    #getTypedFirst(isV) {
        const found = this._.value.find(v => isV ? this.#isValue(v) : this.#isCause(v));
        if (found === undefined) {throw new JudgementError(`${isV ? '値' : 'Errorインスタンス'}が与えられていません。`);}
        return found;
    }
    #isValue(v) {return !this.#isCause(v)}
    #isCause(v) {return v instanceof Error}
    unwrap(...args) {return this.#isCause(this.#first) ? this.throw(args.find(a=>this.#isCause(a))) : this.at(args.find(a=>this.#isValue(a)));}
    throw(fn) {return isFn(fn) ? fn(this.#cause) : this.#throw()}
    #throw() {throw new JudgementError(`失敗。`, this.#cause)}
    at(v) {return undefined!==v ? v : this.#value}
}
export {
    Judgement,
    JudgementError,
    // 単体テスト用に以下もすべて公開する。本番では以下は非公開。
    JudgementResult, Pass, Fail
}
