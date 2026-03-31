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
        fail: (...v) => new Fail(...v),
    })
    , judActs = Object.freeze({mix:0, throw:1, at:2})
    /*
    , judActs = {
        [Judgement.mix]: 0,
        [Judgement.throw]: 1,
        [Judgement.at]: 2,
    }
    */
;
class Judgement {
    // 必ず成功のみ／必ず失敗のみを返す
    static onlyPass(v) {return new Judgement((p,f)=>p(v))}
    static onlyFail(...v) {return new Judgement((p,f)=>f(...v))}
    // 順不同／例外優先／値優先
//    static #failOrders = Object.freeze({Mix:0, Cause:1, Value:2});
//    static get FailOrders() {return this.#failOrders}
//    static #failedAct = Object.freeze({Mix:0, Throw:1, At:2});
//    static get FailedAct() {return this.#failedAct}
    static mix(fn) {return new Judgement(fn, judActs.mix)}
    static throw(fn) {return new Judgement(fn, judActs.throw)}
    static at(fn) {return new Judgement(fn, judActs.at)}
//    static mix(fn) {return new Judgement(fn, this.#failedAct.Mix)}
//    static throw(fn) {return new Judgement(fn, this.#failedAct.Throw)}
//    static at(fn) {return new Judgement(fn, this.#failedAct.At)}
//    static mix(fn) {return new Judgement(fn, this.#failOrders.Mix)}
//    static cause(fn) {return new Judgement(fn, this.#failOrders.Cause)}
//    static value(fn) {return new Judgement(fn, this.#failOrders.Value)}
    // pass/fail()は new Judgement((p,f)=>p(v)) のようにするとPromise.resolve() APIと統一性を持たせられるかも？
//    static pass(v) {return new Pass(v)}         // これは必要か？　コンストラクタだけで十分では？
//    static fail(...v) {return new Fail(...v)}   // これは必要か？　コンストラクタだけで十分では？
    //constructor(fn, failOrder=Judgement.FailOrders.Mix) {
//    constructor(fn, failedAct=Judgement.FailOrders.Mix) {
    constructor(fn, failedAct=judActs.mix) {
        failedAct = this.#validFailedAct(failedAct);
        const res = this.#callbackFn(fn);
        console.log(`res:`, res);
        this.#validResult(res);
        this._={fn, res, failedAct};
    }
    #validFailedAct(v) {// vは数,字,関数のいずれか。0:mix:Judgement.mix, 1:cause:Judgement.cause, 2:value:Judgement.value
        const nms = [...Object.keys(judActs)];
        const cands = isFn(v) ? [nms.map(n=>Judgement[n])] : ((isStr(v) ? nms : (isInt(v) ? [...Object.values(judActs)] : [])));
           
//        const nms = [...Object.keys(judActs)];
//        const cands = isStr(v) ? nms : (isFn(v)
//            ? [nms.map(n=>Judgement[n])]
//            : (isInt(v) ? [...Object.values(judActs)] : []);
        if (cands.some(c=>c===v)) {return isInt(v) ? v : judActs[isFn(v) ? v.name : v]}
        else {throw new TypeError(`failedActが不正値です。実際値:${v} 期待値:${vs}またはJudgement.${nms.join(',')}のいずれか。`)}
        //if (cands.some(c=>c===v)) {return true}
//        this._.failedAct = isFn(v) ? judActs(v) : v;
    }
    //#callbackFn(fn) {throwFn(fn, 'fn'); try {return fn(...'pass fail'.split(' ').map(n=>judRes[n]));} catch(e) {new JudgementError(`new Judgement(fn)のfnコールバック関数実行時に例外発生しました。内容を見直してください。`, e)}}
    #callbackFn(fn) {
        throwFn(fn, 'fn');
        try {
            //return fn(...'pass fail'.split(' ').map(n=>judRes[n]));
            const r = fn((v)=>new Pass(v), (...v)=>new Fail(this._.failedAct, ...v));
            console.log('====================:', typeof fn)
            console.log('#callbackFn(fn):', r);
            return r;
//            return fn((v)=>new Pass(v), (...v)=>new Fail(this._.failedAct, ...v));
        } catch(e) {
            new JudgementImplementationError(`new Judgement(fn)のfnコールバック関数実行時に例外発生しました。内容を見直してください。`, e);
        }
    }
    #validResult(res) {if (!(res instanceof JudgementResult)) {throw new TypeError(`fnの戻り値はPassかFailのいずれかであるべきです。res:${res}`)}}
    /*
    constructor(fn, failedAct=Judgement.FailedAct.Mix) {
        throwFn(fn, 'fn');
        const res = this.#callbackFn(fn);
        const args = ...'Pass Fail'.split(' ').map(n=>globalThis[`new${n}`]);
        try {return isAFn(fn) ? this.#asyncCbFn(fn, ...args) : this.#syncCbFn(fn, ...args)} catch(e) {new JudgementImplementationError(`new Judgement(fn)のfnコールバック関数実行時に例外発生しました。内容を見直してください。`, e)}

    }
    constructor(fn, failedAct=Judgement.FailedAct.Mix) {
        this.#validFailedAct(failedAct);
        const res = this.#callBackFn(fn);
        if (res instanceof Promise) {// fnがasync()=>{}
            res.then(r=>{
                this.#validResult(r);
                this._={fn, res:r, failOrder};
            }).catch(e=>throw new JudgementImplementationError(`new Judgement(fn)のfnは非同期でしたが実行すると例外発生しました。内容を見直してください。`, e));

            (async () => {
                const r = await res;
                try {
                    this.#validResult(r);
                    this._={fn, res:r, failOrder};
                } catch (e) {throw new JudgementImplementationError(`new Judgement(fn)のfnは非同期でしたが実行すると例外発生しました。内容を見直してください。`, e)}
            })();
        } else {// fnが通常関数
            this.#validResult(res);
            this._={fn, res, failOrder};
        }
    }
    //#callBackFn(fn) {try {return fn(...'pass fail'.split(' ').map(n=>Judgement[n]));} catch(e) {new JudgementError(`new Judgement(fn)のfnコールバック関数実行時に例外発生しました。内容を見直してください。`, e)}}
    */
    /*
    #callBackFn(fn) {
        throwFn(fn, 'fn');
        const args = ...'Pass Fail'.split(' ').map(n=>globalThis[`new${n}`]);
        try {return isAFn(fn) ? this.#asyncCbFn(fn, ...args) : this.#syncCbFn(fn, ...args)} catch(e) {new JudgementImplementationError(`new Judgement(fn)のfnコールバック関数実行時に例外発生しました。内容を見直してください。`, e)}
    }
    #syncCbFn(fn, ...args) {return fn(...args);}
    #asyncCbFn(fn) {
        fn.then(res=>res);
        if (isAFn(fn)) {

        }
    }
    #validResult(res) {if (!(res instanceof JudgementResult)) {throw new TypeError(`fnの戻り値はPassかFailのいずれかであるべきです。`)}}
    //#validFailOrder(v) {
    #validFailedAct(v) {
        const vs = [...Object.values(Judgement.FailedAct)];
        if (!vs.some(o=>o===v)) {throw new TypeError(`failedActが不正値です。実際値:${v} 期待値:${vs}のいずれか`)}
//        const vs = [...Object.values(Judgement.#failOrders)];
//        if (!vs.some(o=>o===v)) {throw new TypeError(`failOrderが不正値です。実際値:${v} 期待値:${vs}のいずれか`)}
    }
    */
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
    constructor(act, ...args) {
        super(args); // argsは配列 [Error, -1] など
        this._.act = act;
        //if (0===args.length) {throw new TypeError(`Failの引数は一つ以上必要です。`)}
        if (2!==args.length) {throw new JudgementImplementationError(`Failの引数は二つ必要です。`)}
        this._.first = args[0];
//        this._.candidates = this._.value;
        this._.value = args.find(a=>this.#isValue(a));
        this._.cause = args.find(a=>this.#isCause(a));
        if (undefined===this._.value || undefined===this._.cause) {throw new JudgementImplementationError(`Failの引数はErrorインスタンスとそれ以外の値の二つ必要です。`)}
        if (Judgement.FailedAct.Cause===this._.act && args[0]===this._.value) {throw new JudgementImplementationError(`Failの引数順が不正です。Judgement.FailedAct.Causeが指定されているため、第一引数はErrorインスタンスであるべきです。実際値:${args[0]}`)}
        if (Judgement.FailedAct.Value===this._.act && args[0]===this._.cause) {throw new JudgementImplementationError(`Failの引数順が不正です。Judgement.FailedAct.Valueが指定されているため、第一引数は任意の値（Errorインスタンスを除く）であるべきです。実際値:${args[0]}`)}
    }
    //get candidates() {return [...this._.value]}
    get first() {return this._.first}
    get value() {return this._.value}
    get cause() {return this._.cause}
    #isValue(v) {return !this.#isCause(v)}
    #isCause(v) {return v instanceof Error}
    unwrap(...args) {return this.#isCause(this.first) ? this.throw(...args) : this.at(...args);}
//    throw(fn) {return isFn(fn) ? fn(this.cause) : this.#throw()}
    throw(fn) {if(isFn(fn)){fn(this.cause)}; this.#throw();}
    #throw() {throw new JudgementFailError(`失敗。`, this.cause)}
    at(v) {return undefined!==v ? v : this.value}
}
export {
    Judgement,
    JudgementError,
    // 単体テスト用に以下もすべて公開する。本番では以下は非公開。
    JudgementResult, Pass, Fail
}
