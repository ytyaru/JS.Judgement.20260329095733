class JudgementError extends Error {
    constructor(msg, cause) {
        super(msg, cause ? {cause} : undefined);
        this.name = 'JudgementError';
    }
}
class Judgement {
    static pass(v) {return new Pass(v)}
    static fail(v) {return new Fail(v)}
    static isFn(v) {return 'function'===typeof v}
    static throwFn(v, n) {if (!this.isFn(v)) {throw new TypeError(`${n}は関数であるべきです。`)}}
    constructor(fn) {
        Judgement.throwFn(fn, 'fn');
        const res = fn(...'pass fail'.split(' ').map(n=>Judgement[n]));
        if (!(res instanceof JudgementResult)) {throw new TypeError(`fnの戻り値はPassかFailのいずれかであるべきです。`)}
        this._={fn:fn, res:res};
    }
    get isPass() {return this._.res instanceof Pass}
    get isFail() {return this._.res instanceof FailAny}
    get result() {return this._.res}
    judge() {return this.isPass ? this._.res.value : this._.res.run()}
}
class JudgementResult {
    constructor(value) {this._={value}}
    get value() {return this._.value}
}
class Pass extends JudgementResult {constructor(v) {super(v)}}
class Fail extends JudgementResult {constructor(v) {return v instanceof Error ? new FailCause(v) : new FailValue(v)}}
class FailAny extends JudgementResult {
    constructor(v) {super(v)}
    get isValue() {return !this.isCause}
    get isCause() {return this._.value instanceof Error}
    run() {return this.isCause ? this.#throw() : this.#return();}
    #throw() {if(this.isCause){throw new JudgementError(`失敗。`, this._.value)}}
    #return() {if(this.isValue){return this._.value}}
}
class FailValue extends FailAny {constructor(v){super(v)}}
class FailCause extends FailAny {constructor(v){super(v); if(!(v instanceof Error)){throw new TypeError(`vはErrorかそれを継承した型のインスタンスであるべきです。`)}}}
export {
    Judgement,
    JudgementError,
    // 単体テスト用に以下もすべて公開する。本番では以下は非公開。
    JudgementResult,
    Pass, Fail, FailAny, FailValue, FailCause, 
}
