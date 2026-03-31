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
        this.#validResult(res);
        this._={fn, res, failedAct, on:{pass:undefined, value:undefined, cause:undefined}};
    }
    #validFailedAct(v) {// vは数,字,関数のいずれか。0:mix:Judgement.mix, 1:cause:Judgement.cause, 2:value:Judgement.value
        const nms = [...Object.keys(judActs)];
        const cands = isFn(v) ? nms.map(n=>Judgement[n]) : ((isStr(v) ? nms : (isInt(v) ? [...Object.values(judActs)] : [])));
        if (cands.some(c=>c===v)) {return isInt(v) ? v : judActs[isFn(v) ? v.name : v]}
        else {throw new TypeError(`failedActが不正値です。実際値:${v} 期待値:${nms}またはJudgement.${nms.join(',')}のいずれか。`)}
    }
    #callbackFn(fn, failedAct) {
        throwFn(fn, 'fn');
        try {
            return fn((v)=>new Pass(v), (...v)=>new Fail(failedAct, ...v));
        } catch(e) {
            throw new JudgementImplementationError(`new Judgement(fn)のfnコールバック関数実行時に例外発生しました。内容を見直してください。`, e);
        }
    }
    #validResult(res) {if (!(res instanceof JudgementResult)) {throw new TypeError(`fnの戻り値はPassかFailのいずれかであるべきです。res:${res}`)}}
    get isPass() {return this._.res instanceof Pass}
    get isFail() {return this._.res instanceof Fail}
    get result() {return this._.res}    // これは必要か？　isPass/isFail/judge()/throw()/at()で十分では？
    // judge()呼出時のコールバック関数やデフォルト値の設定（メソッドチェーン）
    onPass(cb) {throwFn(cb); if(this.isPass){this._.on.pass = cb}; return this;}
    onAt(cb) {throwFn(cb); if(this.isFail){this._.on.at = cb}; return this;}
    onThrow(cb) {throwFn(cb); if(this.isFail){this._.on.throw = cb}; return this;}
    // 結果確定（実装任せ／例外発生／値返却）
    judge() {return this.isPass ? (undefined===this._.on.pass ? this._.res.value : this._.on.pass(this._.res.value)) : this._.res.unwrap(this._.on)}
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
        if (2!==args.length) {throw new JudgementImplementationError(`Failの引数は二つ必要です。`)}
        this._.first = args[0];
//        this._.candidates = this._.value;
        this._.cause = args.find(a=>this.#isCause(a));
        this._.value = args.find(a=>this.#isValue(a));
        if (undefined===this._.value || undefined===this._.cause) {throw new JudgementImplementationError(`Failの引数はErrorインスタンスとそれ以外の値の二つ必要です。`)}
        if (judActs.throw===this._.act && args[0]===this._.value) {throw new JudgementImplementationError(`Failの引数順が不正です。Judgement.throwが指定されているため、第一引数はErrorインスタンスであるべきです。実際値:${args[0]}`)}
        if (judActs.at===this._.act && args[0]===this._.cause) {throw new JudgementImplementationError(`Failの引数順が不正です。Judgement.atが指定されているため、第一引数は任意の値（Errorインスタンスを除く）であるべきです。実際値:${args[0]}`)}
    }
    //get candidates() {return [...this._.value]}
    get first() {return this._.first}
    get value() {return this._.value}
    get cause() {return this._.cause}
    #isValue(v) {return !this.#isCause(v)}
    #isCause(v) {return v instanceof Error}
    unwrap(p) {return this.#isCause(this.first) ? this.throw(p?.throw) : this.at(p?.at);}
    throw(fn) {
        const e = new JudgementFailError(`失敗。`, this.cause);
        if(isFn(fn)){ fn(e) }; 
        throw e;
    }
    at(fn) {return isFn(fn) ? fn(this.value) : this.value}
}
export {
    Judgement,
    JudgementError, JudgementImplementationError, JudgementResultError, JudgementFailError,
    // 単体テスト用に以下もすべて公開する。本番では以下は非公開。
    JudgementResult, Pass, Fail
}
