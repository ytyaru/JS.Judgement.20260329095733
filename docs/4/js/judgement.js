class JudgementError extends Error {
    constructor(msg, cause) {
        super(msg, cause ? {cause} : undefined);
//        super(msg, cause instanceof Error ? {cause} : undefined);
//        console.log('JudgementError:', msg, cause);
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
        //if (![Pass,Fail].some(C=>res instanceof C)) {throw new TypeError(`fnの戻り値はPassかFailのいずれかであるべきです。`)}
        this._={fn:fn, res:res};
    }
    get isPass() {return this._.res instanceof Pass}
    get isFail() {return this._.res instanceof FailAny}
    get result() {return this._.res}
    // 値返却系
    judge() {return this.isPass ? this._.res.value : this._.res.run()}
    /*
    // 値返却系
    peel() {return this._.res.value} // 成否問わず値を返す
    throw(pass) {// 失敗時は例外発生する。成功時は処理が設定済みなら実行し、ないなら値を返す
        const isE = this._.res.value instanceof Error;
        console.log(`isE:`, isE, this._.res.value instanceof Error);
        if (this.isFail) {throw new JudgementError(`失敗。${isE ? '' : 'value:'+this.peel()}`, isE ? this._.res.value : undefined)}
        return Judgement.isFn(pass) ? pass(this._.res.value) : this._.res.value;
    }
    judge(pass, fail) {// 成功／失敗時の処理を実行する（必ずどちらか一方を実行する）
        [pass, fail].forEach((fn,i)=>Judgement.throwFn(fn, 0===i ? 'pass' : 'fail'));
        const fn = this.isPass ? pass : fail;
        return fn(this._.res.value);
    }
    // メソッドチェーン系
    pass(fn) {return this.#some('Pass', fn);}
    fail(fn) {return this.#some('Fail', fn);}
    any(fn) {return this.#some('', fn);}
    #some(name, fn) {
        Judgement.throwFn(fn, 'fn');
        if (name ? this[`is${name}`] : true) {fn(this._.res.value);}
        return this;
    }
    */
}
class JudgementResult {
    constructor(value) {this._={value}}
    get value() {return this._.value}
}
class Pass extends JudgementResult {constructor(v) {super(v)}}
//class Fail extends JudgementResult {constructor(v) {super(v)}}
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
