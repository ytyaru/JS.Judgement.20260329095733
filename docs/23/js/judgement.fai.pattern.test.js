import { expect, test, describe } from "bun:test";
import { 
    Judgement, JudgementImplementationError, JudgementAsyncError, 
    JudgementFailError, Pass, Fail 
} from "./judgement.js";

describe('Judgement Exhaustive Matrix Test', () => {
    const E = new Error('TestError');
    const V = 1;

    // --- 1. 入力値のバリエーション定義 ---
    const fns = [
        { name: 'Sync', val: (p, f, res) => res },
        { name: 'Async', val: async (p, f, res) => res },
        { name: 'Invalid', val: 'not a function' }
    ];

    const acts = [
        { name: 'mix', val: Judgement.mix },
        { name: 'throw', val: Judgement.throw },
        { name: 'at', val: Judgement.at },
        { name: 'Invalid', val: 999 }
    ];

    const methods = [
        { name: 'fail', call: (f, args) => f(...args) },
        { name: 'throw', call: (f, args) => f.throw(...args) },
        { name: 'at', call: (f, args) => f.at(...args) }
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

    // --- 2. 期待される結果を判定するロジック（ここが心臓部） ---
    function getExpectedOutcome(fn, act, method, args) {
        // A. コンストラクタ引数チェック
        if (fn.name === 'Invalid' || act.name === 'Invalid') return 'TYPE_ERR';

        // B. 引数の数チェック (Fail.of)
        if (args.val.length !== 2) {
            // fail.throw/at かつ 引数1つ かつ Error なら例外的に許可
            if (method.name !== 'fail' && args.val.length === 1 && args.val[0] instanceof Error) {
                return 'SUCCESS_FAIL';
            }
            return 'IMPL_ERR';
        }

        // C. FailOrder.get のロジック検証
        const [a1, a2] = args.val;
        const isE1 = a1 instanceof Error;
        const isE2 = a2 instanceof Error;

        if (method.name === 'fail') {
            // 片方だけErrorである必要がある
            return (isE1 !== isE2) ? 'SUCCESS_FAIL' : 'IMPL_ERR';
        } else {
            // throw/at の場合は両方Errorである必要がある
            return (isE1 && isE2) ? 'SUCCESS_FAIL' : 'IMPL_ERR';
        }
    }

    // --- 3. マトリクス実行 ---
    for (const f of fns) {
        for (const a of acts) {
            for (const m of methods) {
                for (const p of argsPatterns) {
                    const testName = `${f.name}_${a.name}_${m.name}_${p.name}`;
                    const expected = getExpectedOutcome(f, a, m, p);

                    test(testName, async () => {
                        const create = () => {
                            // fnの中でどのfailメソッドを呼ぶかを動的に決定
                            const testFn = (pass, fail) => m.call(fail, p.val);
                            // 同期/非同期をラップ
                            const wrappedFn = f.name === 'Async' 
                                ? async (pass, fail) => testFn(pass, fail)
                                : (pass, fail) => testFn(pass, fail);
                            
                            return new Judgement(wrappedFn, a.val);
                        };

                        if (expected === 'TYPE_ERR') {
                            expect(create).toThrow(TypeError);
                            return;
                        }

                        try {
                            const j = await create();
                            if (expected === 'IMPL_ERR') {
                                expect.unreachable('Should have thrown JudgementImplementationError');
                            }
                            expect(j.isFail).toBe(true);
                        } catch (e) {
                            if (expected === 'IMPL_ERR') {
                                expect(e).toBeInstanceOf(JudgementImplementationError);
                            } else {
                                throw e; // 想定外のエラー
                            }
                        }
                    });
                }
            }
        }
    }
});

