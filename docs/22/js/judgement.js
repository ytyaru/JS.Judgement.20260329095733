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
;
class Judgement {
    // 必ず成功のみ／必ず失敗のみを返す
    static onlyPass(v) {return new Judgement((p,f)=>p(v))}
    static onlyFail(...v) {return new Judgement((p,f)=>f(...v))}
    // 順不同／例外優先／値優先
    static mix(fn) {return new Judgement(fn, judActs.mix)}
    static throw(fn) {return new Judgement(fn, judActs.throw)}
    static at(fn) {return new Judgement(fn, judActs.at)}
    constructor(fn, failedAct=Judgement.mix) {
        // Factoryパターン: Judgement自体がnewされた時だけ子クラスを返す（スーパークラスのコンストラクタでsuper()された時には実行されない（無限ループ回避））
        if (new.target === Judgement) {
            throwFnOrAFn(fn, 'fn');
            const res = this.#callbackFn(fn, failedAct); // 引数で渡す
            if (!(res instanceof Promise)) {this._validResult(res);}
            return new (isAFn(fn) ? AsyncJudgement : SyncJudgement)(fn, failedAct, res);
        }
    }
    _validResult(res) {if (!(res instanceof JudgementResult)) {throw new TypeError(`fnの戻り値はPassかFailのいずれかであるべきです。res:${res}`)}}
    #callbackFn(fn, failedAct) {
        throwFnOrAFn(fn, 'fn');
        try {return fn(...this.#makePassFail(failedAct))}
        catch(e) {/*console.log(e);*/throw new JudgementImplementationError(`new Judgement(fn)のfnコールバック関数実行時に例外発生しました。内容を見直してください。`, e)}
    }
    #makePassFail(failedAct) {
        const pass = (v) => new Pass(v);
//        const fail = (...args) => Fail.of(failedAct, 0, ...args);
//        fail.throw = (...args) => Fail.of(failedAct, 1, ...args);
//        fail.at = (...args) => Fail.of(failedAct, 2, ...args);
        const fail = (...args) => Fail.mix(failedAct, ...args);
        fail.throw = (...args) => Fail.throw(failedAct, ...args);
        fail.at = (...args) => Fail.at(failedAct, ...args);
        return [pass, fail];
    }
}
class SyncJudgement extends Judgement {
    constructor(fn, failedAct=Judgement.mix, res) {
        super(fn, failedAct);
        this._={fn, res, failedAct, on:{pass:undefined, throw:undefined, at:undefined}};
    }
    get isPass() {return this._.res instanceof Pass}
    get isFail() {return this._.res instanceof Fail}
    // judge()呼出時のコールバック関数やデフォルト値の設定（メソッドチェーン）
    onPass(cb) {throwFn(cb); if(this.isPass){this._.on.pass = cb}; return this;}
    onAt(cb) {throwFn(cb); if(this.isFail){this._.on.at = cb}; return this;}
    onThrow(cb) {throwFn(cb); if(this.isFail){this._.on.throw = cb}; return this;}
    // 結果確定（実装任せ／例外発生／値返却）
    judge() {return this.isPass ? (undefined===this._.on.pass ? this._.res.value : this._.on.pass(this._.res.value)) : this._.res.unwrap(this._.on)}
    throw(fn) {return this.isPass ? this._.res.value : this._.res.throw(fn)}
    at(v) {return this.isPass ? this._.res.value : this._.res.at(v)}
}
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
    get result() {return super.result}    // これは必要か？　isPass/isFail/judge()/throw()/at()で十分では？
    // judge()呼出時のコールバック関数やデフォルト値の設定（メソッドチェーン）
    onPass(cb) {this.#throwPms('onPass()'); return super.onPass(cb);}
    onAt(cb) {this.#throwPms('onAt()'); return super.onAt(cb);}
    onThrow(cb) {this.#throwPms('onThrow()'); return super.onThrow(cb);}
    // 結果確定（実装任せ／例外発生／値返却）
    judge() {this.#throwPms('judge()'); return super.judge();}
    throw(fn) {this.#throwPms('throw()'); return super.throw(fn);}
    at(v) {this.#throwPms('at()'); return super.at(v);}
}
class JudgementResult {
    constructor(value) {this._={value};}
    get value() {return this._.value}
}
class Pass extends JudgementResult {constructor(v) {super(v)}}
class FailOrder {
    static get(order, ...args) {
        // 1引数の場合（.throw() または .at() のみ許可）
        if (1===args.length) {
            if (0===order) this.#throwTwo(order, ...args);
            return [args[0], args[0]]; // cause と value に同じものを入れる
        } else if (2===args.length) {
                 if (0===order && this.#throwMix(...args)) {return isErrIns(args[0]) ? args : args.reverse()}
            else if (1===order && this.#throwThrow(...args)) {return args}
            else if (2===order && this.#throwAt(...args)) {return args.reverse()}
            else {throw new ImplementationError(`プログラミングエラー。orderは0,1,2(片方のみError, 両方Error(throw優先), 両方Error(at優先))のいずれかであるべきです。`)}
        } else {throw this.#throwTwo(order, ...args)}
    }
    static #names = ['fail', 'fail.throw', 'fail.at'];
    static #throwTwo(order, ...args) {throw new JudgementImplementationError(`${this.#names[order]}()の引数は二個であるべきです。実際値:${args.length}個:${args}`)}
    static #throwMix(...args) {
        if (!this.#isSideErr(...args)) {
            throw new JudgementImplementationError(`new Judgement((pass,fail)=>)のfail()の引数は片方のみErrorであるべきです。両方共Errorインスタンスや両方共非Errorインスタンスは禁止です。`);
        } else {return true}
    }
    static #throwThrow(...args) {return this.#throwBoth('throw', ...args)}
    static #throwAt(...args) {return this.#throwBoth('at', ...args)}
    static #throwBoth(name, ...args) {
        if (!this.#isBothErr(...args)) {
            throw new JudgementImplementationError(`new Judgement((pass,fail)=>)のfail.${name}()やfail.at()ならその引数は両方共Errorインスタンスであるべきです。fail.throw()なら例外発生優先、fail.at()なら値返却優先です。`);
        } else {return true}
    }
    static #isBothErr(...args) {return args.every(v=>isErrIns(v))}
    static #isSideErr(...args) {return 1===args.filter(v=>isErrIns(v)).length}
}
class Fail extends JudgementResult {
    // FailMix/FailThrow/FailAtインスタンスを返す
    static mix(act, ...args) {return this.#of(act, 0, ...args)}
    static throw(act, ...args) {return this.#of(act, 1, ...args)}
    static at(act, ...args) {return this.#of(act, 2, ...args)}
    static #of(act, order, ...args) {
        this.#throwOne(...args);
//        this.#throwTwo(...args);
        return new (FailedAct.get(act))(args[0], ...FailOrder.get(order, ...args));
    }
    static #throwOne(...args) {if (0===args.length) {throw new JudgementImplementationError(`Failの引数は一個以上であるべきです。実際値:${args.length}個:${args}`)}}
//    static #throwTwo(...args) {if (2!==args.length) {throw new JudgementImplementationError(`Failの引数は二個であるべきです。実際値:${args.length}個:${args}`)}}
    constructor(first, cause, value) {// of()またはスーパークラスからのみ呼び出される想定。
        super(value);
        this._.first = first;
        this._.cause = cause;
//        console.log(`first:${first}, value:${value}, cause:${cause}`);
    }
    get _isOneAugs() {return this._.value===this._.cause} // これは使わないけど分かりやすさのために書く
    get _isTwoAugs() {return this._.value!==this._.cause} // これを使う
    unwrap(p) {return isErrIns(this._.first) ? this.throw(p?.throw) : this.at(p?.at);}
    throw(fn) {
        const e = new JudgementFailError(`失敗。`, this._.cause);
        if(isFn(fn)){ fn(e) }; 
        throw e;
    }
    at(v) {return undefined===v ? this._.value : isFn(v) ? v(this._.value) : v;}
}
class FailMix extends Fail {constructor(...args){super(...args)}}
class FailThrow extends Fail {
    constructor(...args){super(...args); this.#throw();}
    #throw() {if (this._isTwoAugs && this._.first===this._.value) {throw new JudgementImplementationError(`Failの引数順が不正です。Judgement.throwが指定されているため、第一引数はErrorインスタンスであるべきです。実際値:${this._.first}`)}}
}
class FailAt extends Fail {
    constructor(...args){super(...args); this.#throw();}
    #throw() {if (this._isTwoAugs && this._.first===this._.cause) {throw new JudgementImplementationError(`Failの引数順が不正です。Judgement.atが指定されているため、第一引数は任意の値（Errorインスタンスを除く）であるべきです。実際値:${this._.first}`)}}
}
class FailedAct {
    static #cls = [FailMix, FailThrow, FailAt];
    static #items = 'mix throw at'.split(' ').map((s,n)=>({n:n,s:s,f:Judgement[s],c:this.#cls[n]}));
    static get items() {return this.#items}
    static get(v) {// vは数,字,関数のいずれか。0:mix:Judgement.mix, 1:cause:Judgement.cause, 2:value:Judgement.value
        const a = isFn(v) ? 'f' : (isInt(v) ? 'n' : (isStr(v) ? 's' : ''));
        if (''===a) {this.#throw(v)}
        const r = this.items.find(e=>e[a]===v);
        if (!r) {this.#throw(v)}
        return r.c;
    }
    static #throw(v) {throw new TypeError(`failedActが不正値です。実際値:${v} 期待値:${this.items.map((s,e)=>`${e.n}:${e.s}:Judgement.${e.s}`).join(', ')}のいずれかであるべきです。`)}
}
export {
    Judgement,
    JudgementError, JudgementImplementationError, JudgementAsyncError, JudgementResultError, JudgementFailError,
    // 単体テスト用に以下もすべて公開する。本番では以下は非公開。
    AsyncJudgement, SyncJudgement,
    JudgementResult, Pass, Fail
}
