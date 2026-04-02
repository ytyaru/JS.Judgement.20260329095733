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
            return isAFn(fn) ? new AsyncJudgement(fn, failedAct) : new SyncJudgement(fn, failedAct);
        }
    }
    #getIns() {new (isAFn(fn) ? AsyncJudgement : SyncJudgement)(fn, failedAct)}
    _validResult(res) {if (!(res instanceof JudgementResult)) {throw new TypeError(`fnの戻り値はPassかFailのいずれかであるべきです。res:${res}`)}}
    _callbackFn(fn, failedAct) {
        throwFnOrAFn(fn, 'fn');
        try {return fn(...this.#makePassFail(fn, failedAct))}
        catch(e) {throw new JudgementImplementationError(`new Judgement(fn)のfnコールバック関数実行時に例外発生しました。内容を見直してください。`, e)}
    }
    #makePassFail(fn, failedAct) {
        const pass = (v) => new Pass(v);
        const fail = (...args) => Fail.of(failedAct, ...args);
        fail.throw = (...args) => Fail.of(1, ...args);
        fail.at = (...args) => Fail.of(2, ...args);
        return [pass, fail];
    }
}
class SyncJudgement extends Judgement {
    constructor(fn, failedAct=Judgement.mix) {
        super(fn, failedAct);
//        failedAct = this.#validFailedAct(failedAct);
        const res = this._callbackFn(fn, failedAct); // 引数で渡す
        if (!(res instanceof Promise)) {this._validResult(res);}
        //this._validResult(res);
        this._={fn, res, failedAct, on:{pass:undefined, throw:undefined, at:undefined}};
    }
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
class AsyncJudgement extends SyncJudgement {
    constructor(fn, failedAct=Judgement.mix) {super(fn, failedAct)}
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
class Fail extends JudgementResult {
    // FailMix/FailThrow/FailAtインスタンスを返す
    static of(act, ...args) {return new (FailedAct.get(act))(...args)}
    constructor(...args) {// of()またはスーパークラスからのみ呼び出される想定。
        super(args); // argsは配列 [Error, -1] など
        if (2!==args.length) {throw new JudgementImplementationError(`Failの引数は二つ必要です。`)}
        this._.first = args[0];
        this._.cause = args.find(a=>this.#isCause(a));
        this._.value = args.find(a=>this.#isValue(a));
        if (undefined===this._.value || undefined===this._.cause) {throw new JudgementImplementationError(`Failの引数はErrorインスタンスとそれ以外の値の二つ必要です。`)}
    }
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
    at(v) {return undefined===v ? this.value : isFn(v) ? v(this.value) : v;}
}
class FailMix extends Fail {constructor(...args){super(...args)}}
class FailThrow extends Fail {
    constructor(...args){super(...args); this.#throw();}
    #throw() {if (this.first===this.value) {throw new JudgementImplementationError(`Failの引数順が不正です。Judgement.throwが指定されているため、第一引数はErrorインスタンスであるべきです。実際値:${args[0]}`)}}
}
class FailAt extends Fail {
    constructor(...args){super(...args); this.#throw();}
    #throw() {if (this.first===this._.cause) {throw new JudgementImplementationError(`Failの引数順が不正です。Judgement.atが指定されているため、第一引数は任意の値（Errorインスタンスを除く）であるべきです。実際値:${args[0]}`)}}
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
