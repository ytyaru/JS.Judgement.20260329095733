import { expect, test, describe } from "bun:test";
import { 
    Judgement, AsyncJudgement, SyncJudgement, 
    JudgementImplementationError, JudgementAsyncError, 
    JudgementFailError, Pass, Fail 
} from "./judgement.js";

describe('Judgement Exhaustive Matrix Test', () => {
    const E = new Error('TestError');
    const E2 = new Error('TestError2');
    const V = 1;
    const getId = (v) => Object.prototype.toString.call(v).slice(8, -1);

    // --- 1. コンストラクタ自体の異常系 (2通り) ---
    describe('Constructor Invalid Inputs', () => {
        test('Invalid fn', () => {
            const target = () => new Judgement('not a function');
            expect(target).toThrow(TypeError);
            expect(target).toThrow(`fnは通常の関数（同期または非同期）であるべきです。ジェネレータは許可されません。`);
        });

        test('Invalid failedAct', () => {
            const target = () => new Judgement((p, f) => p(), 999);
            expect(target).toThrow(TypeError);
            expect(target).toThrow(/failedActが不正値です。実際値:999/);
        });
    });

    // --- 2. マトリクス定義 (2 * 3 * 3 * 9 = 162通り) ---
    const fns = [
        { name: 'Sync', isAsync: false },
        { name: 'Async', isAsync: true }
    ];
    const acts = [
        { name: 'mix', val: Judgement.mix, id: 0 },
        { name: 'throw', val: Judgement.throw, id: 1 },
        { name: 'at', val: Judgement.at, id: 2 }
    ];
    const methods = [
        { name: 'fail', id: 0, call: (f, args) => f(...args) },
        { name: 'throw', id: 1, call: (f, args) => f.throw(...args) },
        { name: 'at', id: 2, call: (f, args) => f.at(...args) }
    ];
    const argsPatterns = [
        { name: 'empty', val: [] },
        { name: 'undef', val: [undefined] },
        { name: 'E',     val: [E] },
        { name: 'V',     val: [V] },
        { name: 'E,V',   val: [E, V] },
        { name: 'V,E',   val: [V, E] },
        { name: 'V,V',   val: [V, V] },
        { name: 'E,E',   val: [E, E] },
        { name: 'Triple',val: [E, V, V] }
    ];

    // --- 3. 期待値判定ロジック (Oracle) ---
    function getExpected(fn, act, method, args) {
        const argLen = args.val.length;
        const mName = ['fail', 'fail.throw', 'fail.at'][method.id];

        // A. 引数個数チェック (Fail.#throwOne)
        if (argLen === 0) {
            return { 
                error: JudgementImplementationError, 
                msg: `new Judgement(fn)のfnコールバック関数実行時に例外発生しました。内容を見直してください。`,
                causeMsg: `Failの引数は一個以上であるべきです。実際値:0個:`
            };
        }

        // B. 1引数時のバリデーション (FailOrder.#throwOneType)
        if (argLen === 1) {
            if (method.id === 0) { // fail()
                return { 
                    error: JudgementImplementationError, 
                    msg: `new Judgement(fn)のfnコールバック関数実行時に例外発生しました。内容を見直してください。`,
                    causeMsg: `fail()の引数は二個であるべきです。実際値:1個:`
                };
            }
            if (!(args.val[0] instanceof Error)) { // fail.throw/at(V)
                return { 
                    error: JudgementImplementationError, 
                    msg: `new Judgement(fn)のfnコールバック関数実行時に例外発生しました。内容を見直してください。`,
                    causeMsg: `${mName}()の引数が一個である時、それはErrorインスタンスであるべきです。実際値:${getId(args.val[0])}`
                };
            }
            return { success: true }; // fail.throw/at(E) は成功
        }

        // C. 2引数時のバリデーション (FailOrder.#throwMix / #throwBoth)
        if (argLen === 2) {
            const [a1, a2] = args.val;
            const isE1 = a1 instanceof Error;
            const isE2 = a2 instanceof Error;

            if (method.id === 0) { // fail(a, b)
                if (isE1 === isE2) { // 両方E or 両方V
                    return { 
                        error: JudgementImplementationError, 
                        msg: `new Judgement(fn)のfnコールバック関数実行時に例外発生しました。内容を見直してください。`,
                        causeMsg: `new Judgement((pass,fail)=>)のfail()の引数は片方のみErrorであるべきです。両方共Errorインスタンスや両方共非Errorインスタンスは禁止です。`
                    };
                }
            } else { // fail.throw/at(a, b)
                if (!isE1 || !isE2) {
                    return { 
                        error: JudgementImplementationError, 
                        msg: `new Judgement(fn)のfnコールバック関数実行時に例外発生しました。内容を見直してください。`,
                        causeMsg: `new Judgement((pass,fail)=>)のfail.${method.name}()やfail.at()ならその引数は両方共Errorインスタンスであるべきです。`
                    };
                }
            }
            return { success: true };
        }

        // D. 3引数以上 (Fail.#throwTwo)
        return { 
            error: JudgementImplementationError, 
            msg: `new Judgement(fn)のfnコールバック関数実行時に例外発生しました。内容を見直してください。`,
            causeMsg: `${mName}()の引数は二個であるべきです。実際値:${argLen}個:`
        };
    }

    // --- 4. 実行ループ ---
    for (const f of fns) {
        for (const a of acts) {
            for (const m of methods) {
                for (const p of argsPatterns) {
                    const testName = `${f.name}_${a.name}_${m.name}_${p.name}`;
                    const expected = getExpected(f, a, m, p);

                    test(testName, async () => {
                        const create = () => {
                            const callback = (pass, fail) => m.call(fail, p.val);
                            const fn = f.isAsync ? async (p, f) => callback(p, f) : callback;
                            return new Judgement(fn, a.val);
                        };

                        if (expected.success) {
                            let j;
                            if (f.isAsync) {
                                // Async版のawait忘れチェック
                                j = create();
                                expect(() => j.isFail).toThrow(JudgementAsyncError);
                                j = await j;
                            } else {
                                j = create();
                            }
                            
                            expect(j.isFail).toBe(true);
                            expect(j.isPass).toBe(false);

                            // 振る舞いチェック (judge / throw / at)
                            const first = p.val[0];
                            const isFirstError = first instanceof Error;

                            // judge() の検証
                            try {
                                const res = j.judge();
                                if (isFirstError) expect.unreachable('judge() should throw if first arg is Error');
                                // 値が返る場合
                                expect(res).toBe(j._.res._.value);
                            } catch (e) {
                                if (!isFirstError) throw e;
                                expect(e).toBeInstanceOf(JudgementFailError);
                                expect(e.message).toBe('失敗。');
                                expect(e.cause).toBe(j._.res._.cause);
                            }

                            // at() の検証 (常に値を返す)
                            expect(j.at()).toBe(j._.res._.value);

                            // throw() の検証 (常に投げる)
                            try {
                                j.throw();
                                expect.unreachable('throw() should always throw');
                            } catch (e) {
                                expect(e).toBeInstanceOf(JudgementFailError);
                                expect(e.message).toBe('失敗。');
                            }

                        } else {
                            // 異常系の検証
                            try {
                                if (f.isAsync) await create();
                                else create();
                                expect.unreachable('Should have thrown an error');
                            } catch (e) {
                                expect(e).toBeInstanceOf(expected.error);
                                expect(e.message).toBe(expected.msg);
                                if (expected.causeMsg) {
                                    expect(e.cause).toBeDefined();
                                    expect(e.cause.message).toStartWith(expected.causeMsg);
                                }
                            }
                        }
                    });
                }
            }
        }
    }
});

