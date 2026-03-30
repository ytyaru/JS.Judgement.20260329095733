import { expect, test, describe, mock } from "bun:test";
import { Judgement, JudgementError, JudgementResult, Pass, Fail } from "./judgement.js";
describe('Judgement', () => {
    describe('instance', () => {
        describe('constructor()', () => {
            test('constructor(fn)', () => {
                const j = new Judgement((pass,fail)=>pass(1));
                expect(j).toBeInstanceOf(Judgement);
            });
            test('constructor(undefined)', () => {
                const target = ()=>new Judgement();
                expect(target).toThrow(TypeError);
                expect(target).toThrow(`fnは関数であるべきです。`);
            });
            test('constructor(fn(PassかFailを返さぬ))', () => {
                const target = ()=>new Judgement((pass,fail)=>0);
                expect(target).toThrow(TypeError);
                expect(target).toThrow(`fnの戻り値はPassかFailのいずれかであるべきです。`);
            });
            test('constructor(fn(Pass))', () => {
                const j = new Judgement((pass,fail)=>pass(1));
                expect(j).toBeInstanceOf(Judgement);
                expect(j.isPass).toBe(true);
                expect(j.isFail).toBe(false);
                expect(j.result).toBeInstanceOf(Pass);
                expect(j.result.value).toBe(1);
            });
            test('constructor(fn(Fail(1)))', () => {
                const j = new Judgement((pass,fail)=>fail(1));
                expect(j).toBeInstanceOf(Judgement);
                expect(j.isFail).toBe(true);
                expect(j.isPass).toBe(false);
                expect(j.result).toBeInstanceOf(Fail);
                expect(j.result.value).toBe(1);
                expect(j.result.candidates).toEqual([1]);
                try {j.result.cause; expect.unreachable();} catch (e) {
                    expect(e).toBeInstanceOf(JudgementError);
                    expect(e.message).toBe(`Errorインスタンスが与えられていません。`);
                }
            });
            test('constructor(fn(Fail(Error)))', () => {
                const cause = new Error('X');
                const j = new Judgement((pass,fail)=>fail(cause));
                expect(j).toBeInstanceOf(Judgement);
                expect(j.isFail).toBe(true);
                expect(j.isPass).toBe(false);
                expect(j.result).toBeInstanceOf(Fail);
                expect(j.result.cause).toBe(cause);
                expect(j.result.candidates).toEqual([cause]);
                try {j.result.value; expect.unreachable();} catch (e) {
                    expect(e).toBeInstanceOf(JudgementError);
                    expect(e.message).toBe(`値が与えられていません。`);
                }
            });
            test('constructor(fn(Fail(1,Error)))', () => {
                const cause = new Error('X');
                const j = new Judgement((pass,fail)=>fail(1,cause));
                expect(j).toBeInstanceOf(Judgement);
                expect(j.isFail).toBe(true);
                expect(j.isPass).toBe(false);
                expect(j.result).toBeInstanceOf(Fail);
                expect(j.result.value).toBe(1);
                expect(j.result.cause).toBe(cause);
                expect(j.result.candidates).toEqual([1, cause]);
            });
            test('constructor(fn(Fail(Error,1)))', () => {
                const cause = new Error('X');
                const j = new Judgement((pass,fail)=>fail(cause,1));
                expect(j).toBeInstanceOf(Judgement);
                expect(j.isFail).toBe(true);
                expect(j.isPass).toBe(false);
                expect(j.result).toBeInstanceOf(Fail);
                expect(j.result.value).toBe(1);
                expect(j.result.cause).toBe(cause);
                expect(j.result.candidates).toEqual([cause,1]);
            });
            test('constructor(fn(Fail(1,2)))', () => {
                const j = new Judgement((pass,fail)=>fail(1,2));
                expect(j).toBeInstanceOf(Judgement);
                expect(j.isFail).toBe(true);
                expect(j.isPass).toBe(false);
                expect(j.result).toBeInstanceOf(Fail);
                expect(j.result.value).toBe(1);
                expect(j.result.candidates).toEqual([1,2]);
                try {j.result.cause; expect.unreachable();} catch (e) {
                    expect(e).toBeInstanceOf(JudgementError);
                    expect(e.message).toBe(`Errorインスタンスが与えられていません。`);
                }
            });
            test('constructor(fn(Fail(2,1)))', () => {
                const j = new Judgement((pass,fail)=>fail(2,1));
                expect(j).toBeInstanceOf(Judgement);
                expect(j.isFail).toBe(true);
                expect(j.isPass).toBe(false);
                expect(j.result).toBeInstanceOf(Fail);
                expect(j.result.value).toBe(2);
                expect(j.result.candidates).toEqual([2,1]);
                try {j.result.cause; expect.unreachable();} catch (e) {
                    expect(e).toBeInstanceOf(JudgementError);
                    expect(e.message).toBe(`Errorインスタンスが与えられていません。`);
                }
            });
            test('constructor(fn(Fail(Error,Error)))', () => {
                const cause = new Error('X');
                const cause2 = new Error('Y');
                const j = new Judgement((pass,fail)=>fail(cause,cause2));
                expect(j).toBeInstanceOf(Judgement);
                expect(j.isFail).toBe(true);
                expect(j.isPass).toBe(false);
                expect(j.result).toBeInstanceOf(Fail);
                expect(j.result.cause).toBe(cause);
                expect(j.result.candidates).toEqual([cause,cause2]);
                try {j.result.value; expect.unreachable();} catch (e) {
                    expect(e).toBeInstanceOf(JudgementError);
                    expect(e.message).toBe(`値が与えられていません。`);
                }
            });
        });
        describe('judge()', () => {
            describe('judge(undefined)', () => {
                test('new Judgement((pass,fail)=>pass(1))', () => {
                    const j = new Judgement((pass,fail)=>pass(1));
                    expect(j.judge()).toBe(1);
                });
                test('new Judgement((pass,fail)=>fail(1))', () => {
                    const j = new Judgement((pass,fail)=>fail(1));
                    expect(j.judge()).toBe(1);
                });
                test(`new Judgement((pass,fail)=>fail(Error))`, () => {
                    const cause = new Error('X');
                    const j = new Judgement((pass,fail)=>fail(cause));
                    try {j.judge(); expect.unreachable();} catch (e) {
                        expect(e).toBeInstanceOf(JudgementError);
                        expect(e.message).toBe('失敗。');
                        expect(e.cause).toBe(cause); 
                        expect(e.cause.message).toBe(cause.message);
                    }
                });
                test(`new Judgement((pass,fail)=>fail(1,Error))`, () => {
                    const cause = new Error('X');
                    const j = new Judgement((pass,fail)=>fail(1, cause));
                    expect(j.judge()).toBe(1);
                });
                test(`new Judgement((pass,fail)=>fail(Error,1))`, () => {
                    const cause = new Error('X');
                    const j = new Judgement((pass,fail)=>fail(cause,1));
                    try {j.judge(); expect.unreachable();} catch (e) {
                        expect(e).toBeInstanceOf(JudgementError);
                        expect(e.message).toBe('失敗。');
                        expect(e.cause).toBe(cause); 
                        expect(e.cause.message).toBe(cause.message);
                    }
                });
                test('new Judgement((pass,fail)=>fail(1,2))', () => {
                    const j = new Judgement((pass,fail)=>fail(1,2));
                    expect(j.judge()).toBe(1);
                });
                test('new Judgement((pass,fail)=>fail(2,1))', () => {
                    const j = new Judgement((pass,fail)=>fail(2,1));
                    expect(j.judge()).toBe(2);
                });
                test(`new Judgement((pass,fail)=>fail(Error,Error))`, () => {
                    const cause = new Error('X');
                    const cause2 = new Error('Y');
                    const j = new Judgement((pass,fail)=>fail(cause,cause2));
                    try {j.judge(); expect.unreachable();} catch (e) {
                        expect(e).toBeInstanceOf(JudgementError);
                        expect(e.message).toBe('失敗。');
                        expect(e.cause).toBe(cause); 
                        expect(e.cause.message).toBe(cause.message);
                    }
                });
                test(`new Judgement((pass,fail)=>fail(ErrorY,ErrorX))`, () => {
                    const cause = new Error('Y');
                    const cause2 = new Error('X');
                    const j = new Judgement((pass,fail)=>fail(cause,cause2));
                    try {j.judge(); expect.unreachable();} catch (e) {
                        expect(e).toBeInstanceOf(JudgementError);
                        expect(e.message).toBe('失敗。');
                        expect(e.cause).toBe(cause); 
                        expect(e.cause.message).toBe(cause.message);
                    }
                });
            });
            describe('judge(fn)', () => {
                test.todo(`judge(undefined)を真似て網羅テストを書くこと。`, ()=>{});
            });
            describe('judge(value)', () => {
                test.todo(`judge(undefined)を真似て網羅テストを書くこと。`, ()=>{});
            });
        });
        describe('実装例indexOf(fail(Error))', () => {
            const indexOf = (s, c) => {
                return new Judgement((pass, fail)=>{
                    const i = s.indexOf(c);
                    return 0<=i ? pass(i) : fail(new Error(`指定の字'${c}'は存在しませんでした。`));
                });
            };
            test('成功', () => {
                const res = indexOf('abcdef', 'd');
                const index = res.judge();
                expect(res).toBeInstanceOf(Judgement);
                expect(res.isPass).toBe(true);
                expect(res.isFail).toBe(false);
                expect(index).toBe(3);
            });
            test('失敗', () => {
                const res = indexOf('abcdef', 'z');
                expect(res).toBeInstanceOf(Judgement);
                expect(res.isPass).toBe(false);
                expect(res.isFail).toBe(true);
                try {res.judge(); expect.unreachable();} catch (e) {
                    expect(e).toBeInstanceOf(JudgementError);
                    expect(e.message).toBe('失敗。');
                    expect(e.cause).toBeInstanceOf(Error); 
                    expect(e.cause.message).toBe(`指定の字'z'は存在しませんでした。`);
                }
            });
        });
        describe('実装例indexOf(fail(-1))', () => {
            const failValue = -1;
            const indexOf = (s, c) => {
                return new Judgement((pass, fail)=>{
                    const i = s.indexOf(c);
                    return 0<=i ? pass(i) : fail(failValue);
                });
            };
            test('成功', () => {
                const res = indexOf('abcdef', 'd');
                const index = res.judge();
                expect(res).toBeInstanceOf(Judgement);
                expect(res.isPass).toBe(true);
                expect(res.isFail).toBe(false);
                expect(index).toBe(3);
            });
            test('失敗', () => {
                const res = indexOf('abcdef', 'z');
                const index = res.judge();
                expect(res).toBeInstanceOf(Judgement);
                expect(res.isPass).toBe(false);
                expect(res.isFail).toBe(true);
                expect(index).toBe(failValue);
            });
        });
        describe('実装例indexOf(fail(3)) 失敗時も成功時と同じ値を返すがisPass/Failで識別可能', () => {
            const failValue = 3;
            const indexOf = (s, c) => {
                return new Judgement((pass, fail)=>{
                    const i = s.indexOf(c);
                    return 0<=i ? pass(i) : fail(failValue);
                });
            };
            test('成功', () => {
                const res = indexOf('abcdef', 'd');
                const index = res.judge();
                expect(res).toBeInstanceOf(Judgement);
                expect(res.isPass).toBe(true);
                expect(res.isFail).toBe(false);
                expect(index).toBe(3);
            });
            test('失敗', () => {
                const res = indexOf('abcdef', 'z');
                const index = res.judge();
                expect(res).toBeInstanceOf(Judgement);
                expect(res.isPass).toBe(false);
                expect(res.isFail).toBe(true);
                expect(index).toBe(3);
            });
        });
        describe('実装例indexOf(fail(...args)) ', () => {
            test.todo(`実装例indexOf(fail(...args)) のパターン追加。judge(undefined)を真似て網羅テストを書くこと。`, ()=>{});
        });

        describe('throw()', () => {
            describe('throw(undefined)', () => {
                test('new Judgement((pass,fail)=>pass(1))', () => {
                    const j = new Judgement((pass,fail)=>pass(1));
                    expect(j.throw()).toBe(1);
                });
                test('new Judgement((pass,fail)=>fail(1))', () => {
                    const j = new Judgement((pass,fail)=>fail(1));
                    try {j.throw(); expect.unreachable();} catch (e) {
                        expect(e).toBeInstanceOf(JudgementError);
                        expect(e.message).toBe(`Errorインスタンスが与えられていません。`);
                    }
                });
                test(`new Judgement((pass,fail)=>fail(Error))`, () => {
                    const cause = new Error('X');
                    const j = new Judgement((pass,fail)=>fail(cause));
                    try {j.throw(); expect.unreachable();} catch (e) {
                        expect(e).toBeInstanceOf(JudgementError);
                        expect(e.message).toBe('失敗。');
                        expect(e.cause).toBe(cause); 
                        expect(e.cause.message).toBe(cause.message);
                    }
                });
                test(`new Judgement((pass,fail)=>fail(1,Error))`, () => {
                    const cause = new Error('X');
                    const j = new Judgement((pass,fail)=>fail(1, cause));
                    try {j.throw(); expect.unreachable();} catch (e) {
                        expect(e).toBeInstanceOf(JudgementError);
                        expect(e.message).toBe('失敗。');
                        expect(e.cause).toBe(cause); 
                        expect(e.cause.message).toBe(cause.message);
                    }
                });
                test(`new Judgement((pass,fail)=>fail(Error,1))`, () => {
                    const cause = new Error('X');
                    const j = new Judgement((pass,fail)=>fail(cause,1));
                    try {j.throw(); expect.unreachable();} catch (e) {
                        expect(e).toBeInstanceOf(JudgementError);
                        expect(e.message).toBe('失敗。');
                        expect(e.cause).toBe(cause); 
                        expect(e.cause.message).toBe(cause.message);
                    }
                });
                test('new Judgement((pass,fail)=>fail(1,2))', () => {
                    const j = new Judgement((pass,fail)=>fail(1,2));
                    try {j.throw(); expect.unreachable();} catch (e) {
                        expect(e).toBeInstanceOf(JudgementError);
                        expect(e.message).toBe(`Errorインスタンスが与えられていません。`);
                    }
                });
                test('new Judgement((pass,fail)=>fail(2,1))', () => {
                    const j = new Judgement((pass,fail)=>fail(2,1));
                    try {j.throw(); expect.unreachable();} catch (e) {
                        expect(e).toBeInstanceOf(JudgementError);
                        expect(e.message).toBe(`Errorインスタンスが与えられていません。`);
                    }
                });
                test(`new Judgement((pass,fail)=>fail(Error,Error))`, () => {
                    const cause = new Error('X');
                    const cause2 = new Error('Y');
                    const j = new Judgement((pass,fail)=>fail(cause,cause2));
                    try {j.throw(); expect.unreachable();} catch (e) {
                        expect(e).toBeInstanceOf(JudgementError);
                        expect(e.message).toBe('失敗。');
                        expect(e.cause).toBe(cause); 
                        expect(e.cause.message).toBe(cause.message);
                    }
                });
                test(`new Judgement((pass,fail)=>fail(ErrorY,ErrorX))`, () => {
                    const cause = new Error('Y');
                    const cause2 = new Error('X');
                    const j = new Judgement((pass,fail)=>fail(cause,cause2));
                    try {j.throw(); expect.unreachable();} catch (e) {
                        expect(e).toBeInstanceOf(JudgementError);
                        expect(e.message).toBe('失敗。');
                        expect(e.cause).toBe(cause); 
                        expect(e.cause.message).toBe(cause.message);
                    }
                });
            });
            describe('throw(fn)', () => {
                test.todo(`throw(undefined)を真似て網羅テストを書くこと。`, ()=>{});
            });
        });
        describe('at()', () => {
            describe('at(undefined)', () => {
                test('new Judgement((pass,fail)=>pass(1))', () => {
                    const j = new Judgement((pass,fail)=>pass(1));
                    expect(j.at()).toBe(1);
                });
                test('new Judgement((pass,fail)=>fail(1))', () => {
                    const j = new Judgement((pass,fail)=>fail(1));
                    expect(j.at()).toBe(1);
                });
                test(`new Judgement((pass,fail)=>fail(Error))`, () => {
                    const cause = new Error('X');
                    const j = new Judgement((pass,fail)=>fail(cause));
                    try {j.at(); expect.unreachable();} catch (e) {
                        expect(e).toBeInstanceOf(JudgementError);
                        expect(e.message).toBe(`値が与えられていません。`);
                    }
                });
                test(`new Judgement((pass,fail)=>fail(1,Error))`, () => {
                    const cause = new Error('X');
                    const j = new Judgement((pass,fail)=>fail(1, cause));
                    expect(j.at()).toBe(1);
                });
                test(`new Judgement((pass,fail)=>fail(Error,1))`, () => {
                    const cause = new Error('X');
                    const j = new Judgement((pass,fail)=>fail(cause,1));
                    expect(j.at()).toBe(1);
                });
                test('new Judgement((pass,fail)=>fail(1,2))', () => {
                    const j = new Judgement((pass,fail)=>fail(1,2));
                    expect(j.at()).toBe(1);
                });
                test('new Judgement((pass,fail)=>fail(2,1))', () => {
                    const j = new Judgement((pass,fail)=>fail(2,1));
                    expect(j.at()).toBe(2);
                });
                test(`new Judgement((pass,fail)=>fail(Error,Error))`, () => {
                    const cause = new Error('X');
                    const cause2 = new Error('Y');
                    const j = new Judgement((pass,fail)=>fail(cause,cause2));
                    try {j.at(); expect.unreachable();} catch (e) {
                        expect(e).toBeInstanceOf(JudgementError);
                        expect(e.message).toBe(`値が与えられていません。`);
                    }
                });
                test(`new Judgement((pass,fail)=>fail(ErrorY,ErrorX))`, () => {
                    const cause = new Error('Y');
                    const cause2 = new Error('X');
                    const j = new Judgement((pass,fail)=>fail(cause,cause2));
                    try {j.at(); expect.unreachable();} catch (e) {
                        expect(e).toBeInstanceOf(JudgementError);
                        expect(e.message).toBe(`値が与えられていません。`);
                    }
                });
            });
            describe('at(defaultValue)', () => {
                test.todo(`at(undefined)を真似て網羅テストを書くこと。`, ()=>{});
            });
        });
    });
});

