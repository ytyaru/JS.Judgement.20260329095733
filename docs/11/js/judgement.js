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
const isFn = (v) => 'function'===typeof v
    , throwFn = (v, n) => {if (!isFn(v)) {throw new TypeError(`${n}は関数であるべきです。`)}}
    , AsyncFunction = Object.getPrototypeOf(async function(){}).constructor
    , isAFn = (v) => v instanceof AsyncFunction
    , isStr = (v) => 'string'===typeof v
    , isInt = (v) => Number.isSafeInteger(v)
    , judRes = Object.freeze({
        pass: (v) => new Pass(v),
        fail: (failedAct, ...vs) => new Fail(failedAct, ...vs),
    })
    , judActs = Object.freeze({mix:0, throw:1, at:2})
;
class Judgement {
    // 必ず成功のみ／必ず失敗のみを返す
    static onlyPass(v) {return new Judgement((p,f)=>p(v))}
    static onlyFail(...v) {return new Judgement((p,f)=>f(...v))}
    // 順不同／例外優先／値優先
    static mix(fn) {return new Judgement(fn, judActs.mix)}
    static throw(fn) {return new Judgement(fn, judActs.throw)}
    static at(fn) {return new Judgement(fn, judActs.at)}
    constructor(fn, failedAct=judActs.mix) {
        failedAct = this.#validFailedAct(failedAct);
        const res = this.#callbackFn(fn, failedAct); // 引数で渡す
//        console.log(`res:`, res);
        this.#validResult(res);
        this._={fn, res, failedAct, processor:{pass:undefined, value:undefined, cause:undefined}};
    }
    #validFailedAct(v) {// vは数,字,関数のいずれか。0:mix:Judgement.mix, 1:cause:Judgement.cause, 2:value:Judgement.value
        const nms = [...Object.keys(judActs)];
        const cands = isFn(v) ? [nms.map(n=>Judgement[n])] : ((isStr(v) ? nms : (isInt(v) ? [...Object.values(judActs)] : [])));
        if (cands.some(c=>c===v)) {return isInt(v) ? v : judActs[isFn(v) ? v.name : v]}
        else {throw new TypeError(`failedActが不正値です。実際値:${v} 期待値:${nms}またはJudgement.${nms.join(',')}のいずれか。`)}
    }
    #callbackFn(fn, failedAct) {
        throwFn(fn, 'fn');
        try {
            // this._.failedAct ではなく、引数の failedAct を使う
            return fn((v)=>new Pass(v), (...v)=>new Fail(failedAct, ...v));
//            return fn(judRes.pass, (...v)=>new Fail(failedAct, ...v));
        } catch(e) {
//            console.log(e);
            throw new JudgementImplementationError(`new Judgement(fn)のfnコールバック関数実行時に例外発生しました。内容を見直してください。`, e);
        }
        /*
        try {
            //return fn(...'pass fail'.split(' ').map(n=>judRes[n]));
            console.log('====================:', typeof fn)
            const r = fn((v)=>new Pass(v), (...v)=>new Fail(failedAct, ...v));
            console.log('#callbackFn(fn):', r);
            return r;
//            return fn((v)=>new Pass(v), (...v)=>new Fail(this._.failedAct, ...v));
        } catch(e) {
            throw new JudgementImplementationError(`new Judgement(fn)のfnコールバック関数実行時に例外発生しました。内容を見直してください。`, e);
        }
        */
    }
    #validResult(res) {if (!(res instanceof JudgementResult)) {throw new TypeError(`fnの戻り値はPassかFailのいずれかであるべきです。res:${res}`)}}
    get isPass() {return this._.res instanceof Pass}
    get isFail() {return this._.res instanceof Fail}
    get result() {return this._.res}    // これは必要か？　isPass/isFail/judge()/throw()/at()で十分では？
    // コールバック関数やデフォルト値の設定（メソッドチェーン）
//    fail(v) {if(this.isFail){if(isFn(v)){this.result.cb=v}else{this.result.alt=v}}}
//    fail(v) {if(this.isFail){this.result[isFn(v) ? 'cb' : 'alt']=v}}
//    pass(cb) {if(this.isPass){this.result.cb = cb}; return this;}
//    value(v) {if(this.isFail){this.result.alt=v}; return this;}
//    cause(v) {if(this.isFail && isFn(v)){this.result.cb=v}; return this;}
    pass(cb) {throwFn(cb); if(this.isPass){this._.processor.pass = cb}; return this;}
    value(v) {if(this.isFail){this._.processor.value=v}; return this;}
    cause(cb) {throwFn(cb); if(this.isFail){this._.processor.cause = cb}; return this;}
    // 結果確定（実装任せ／例外発生／値返却）
    //judge(...args) {return this.isPass ? this._.res.value : this._.res.unwrap(...args)}
    judge() {return this.isPass ? (undefined===this._.processor.pass ? this._.res.value : this._.processor.pass) : this._.res.unwrap(this._.processor)}
    throw(fn) {return this.isPass ? this._.res.value : this._.res.throw(fn)}
    at(v) {return this.isPass ? this._.res.value : this._.res.at(v)}
}
class JudgementResult {
    constructor(value) {this._={value};}
    get value() {return this._.value}
}
class Pass extends JudgementResult {constructor(v) {super(v)}}
class Fail extends JudgementResult {
    constructor(act, ...args) {
        super(args); // argsは配列 [Error, -1] など
        this._.act = act;
        //if (0===args.length) {throw new TypeError(`Failの引数は一つ以上必要です。`)}
        if (2!==args.length) {throw new JudgementImplementationError(`Failの引数は二つ必要です。`)}
        this._.first = args[0];
//        this._.candidates = this._.value;
        this._.cause = args.find(a=>this.#isCause(a));
        this._.value = args.find(a=>this.#isValue(a));
//        console.log('cause,value:', this._.cause, this._.value);
        if (undefined===this._.value || undefined===this._.cause) {throw new JudgementImplementationError(`Failの引数はErrorインスタンスとそれ以外の値の二つ必要です。`)}
//        if (Judgement.FailedAct.Cause===this._.act && args[0]===this._.value) {throw new JudgementImplementationError(`Failの引数順が不正です。Judgement.FailedAct.Causeが指定されているため、第一引数はErrorインスタンスであるべきです。実際値:${args[0]}`)}
//        if (Judgement.FailedAct.Value===this._.act && args[0]===this._.cause) {throw new JudgementImplementationError(`Failの引数順が不正です。Judgement.FailedAct.Valueが指定されているため、第一引数は任意の値（Errorインスタンスを除く）であるべきです。実際値:${args[0]}`)}
        if (judActs.throw===this._.act && args[0]===this._.value) {throw new JudgementImplementationError(`Failの引数順が不正です。Judgement.throwが指定されているため、第一引数はErrorインスタンスであるべきです。実際値:${args[0]}`)}
        if (judActs.at===this._.act && args[0]===this._.cause) {throw new JudgementImplementationError(`Failの引数順が不正です。Judgement.atが指定されているため、第一引数は任意の値（Errorインスタンスを除く）であるべきです。実際値:${args[0]}`)}

    }
    //get candidates() {return [...this._.value]}
    get first() {return this._.first}
    get value() {return this._.value}
    get cause() {return this._.cause}
    #isValue(v) {return !this.#isCause(v)}
    #isCause(v) {return v instanceof Error}
    unwrap(p) {return this.#isCause(this.first) ? this.throw(p?.cause) : this.at(p?.value);}
//    unwrap(...args) {return this.#isCause(this.first) ? this.throw(...args) : this.at(...args);}
//    throw(fn) {return isFn(fn) ? fn(this.cause) : this.#throw()}
//    throw(fn) {if(isFn(fn)){fn(this.cause)}; this.#throw();}
    throw(fn) {if(isFn(fn)){fn(this.#error())}; this.#throw();}
    #throw() {throw this.#error()}
    #error() {return new JudgementFailError(`失敗。`, this.cause)}
//    at() {return undefined!==this._.alt ? this._.alt : this.value}
    at(v) {return undefined!==v ? v : this.value}
}
export {
    Judgement,
    JudgementError, JudgementImplementationError, JudgementResultError, JudgementFailError,
    // 単体テスト用に以下もすべて公開する。本番では以下は非公開。
    JudgementResult, Pass, Fail
}
