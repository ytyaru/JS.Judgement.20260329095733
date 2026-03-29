class JudgementError extends Error {
    constructor(msg, cause) {
        super(msg, cause ? {cause} : undefined);
        this.name = 'JudgementError';
    }
}
class Judgement {
    static pass(v) {return new Pass(v)}
    static fail(...v) {return new Fail(...v)}
    static isFn(v) {return 'function'===typeof v}
    static throwFn(v, n) {if (!this.isFn(v)) {throw new TypeError(`${n}は関数であるべきです。`)}}
    constructor(fn) {
        Judgement.throwFn(fn, 'fn');
        const res = fn(...'pass fail'.split(' ').map(n=>Judgement[n]));
        if (!(res instanceof JudgementResult)) {throw new TypeError(`fnの戻り値はPassかFailのいずれかであるべきです。`)}
        this._={fn:fn, res:res};
    }
    get isPass() {return this._.res instanceof Pass}
    get isFail() {return this._.res instanceof Fail}
    get result() {return this._.res}
    judge(...args) {return this.isPass ? this._.res.value : this._.res.unwrap(...args)}
    throw(fn) {return this.isPass ? this._.res.value : this._.res.throw(fn)}
    at(v) {return this.isPass ? this._.res.value : this._.res.at(v)}
    //throw(fn) {return this.isPass ? this._.res.value : (Judgement.isFn(fn) ? fn(this._.res.cause) : this._.res.throw())}
    //at(v) {return this.isPass ? this._.res.value : (undefined===v ? this._.res.at(v) : v)}
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
    throw(fn) {return Judgement.isFn(fn) ? fn(this.#cause) : this.#throw()}
    #throw() {throw new JudgementError(`失敗。`, this.#cause)}
    at(v) {return undefined!==v ? v : this.#value}
    //unwrap() {return this.#isCause(this.#first) ? this.throw() : this.at()}
    //throw() {throw new JudgementError(`失敗。`, this.#cause)}
}
export {
    Judgement,
    JudgementError,
    // 単体テスト用に以下もすべて公開する。本番では以下は非公開。
    JudgementResult, Pass, Fail
}
