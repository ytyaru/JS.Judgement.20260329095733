export class Judgement {
    static pass(v) {return new Pass(v)}
    static fail(v) {return new Fail(v)}
    static isFn(v, n) {return 'function'==typeof v}
    static throwFn(v, n) {if (!this.isFn(v)) {throw new TypeError(`${n}は関数であるべきです。`)}}
    constructor(fn) {
        Judgement.throwFn(fn, 'fn');
        const res = fn('pass fail'.split(' ').map(n=>Judgement[n]));
        if (![Pass,Fail].some(C=>res instanceof C)) {throw new TypeError(`fnの戻り値はPassかFailのいずれかであるべきです。`)}
        this._={fn:fn, res:res};
    }
    get isPass() {return this._.res instanceof Pass}
    get isFail() {return this._.res instanceof Fail}
    get result() {return this._.res}
    judge(pass, fail) {
        [pass, fail].forEach((fn,i)=>Judgement.throwFn(fn, 0===i ? 'pass' : 'fail'));
        const fn = this.isPass ? pass : fail;
        const arg = this._.res[this.isPass ? 'value' : 'cause'];
        return fn(arg);
    }
    pass(fn) {return #some('Pass', fn);}
    fail(fn) {return #some('Fail', fn);}
    #some(name, fn) {
        Judgement.throwFn(fn, 'fn');
        if (this[`is${name}`]) {fn(this._.res['Pass'===name ? 'value' : 'cause']);}
        return this;
    }
    any(fn) {fn(this._.res); return this;}
}
class JudgementResult {}
class Pass extends JudgementResult {
    constructor(value) {this._={value}}
    get value() {return this._.value}
}
class Fail extends JudgementResult {
    constructor(cause) {this._={cause}}
    get cause() {return this._.cause}
    throw(error) {throw (error instanceof Error ? error : this._.cause)}
}

