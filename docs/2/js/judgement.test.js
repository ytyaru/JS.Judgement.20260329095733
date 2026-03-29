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
            test('constructor(fn(Fail))', () => {
                const j = new Judgement((pass,fail)=>fail(1));
                expect(j).toBeInstanceOf(Judgement);
                expect(j.isFail).toBe(true);
                expect(j.isPass).toBe(false);
                expect(j.result).toBeInstanceOf(Fail);
                expect(j.result.value).toBe(1);
            });
        });
        describe('peel()', () => {
            describe('new Judgement((pass,fail)=>pass(1))(pass,fail)=>pass(1))', () => {
                test('peel()', () => {
                    const j = new Judgement((pass,fail)=>pass(1));
                    expect(j.peel()).toBe(1);
                });
            });
            describe('new Judgement((pass,fail)=>pass(1))(pass,fail)=>fail(1))', () => {
                test('peel()', () => {
                    const j = new Judgement((pass,fail)=>fail(1));
                    expect(j.peel()).toBe(1);
                });
            });
        });
        describe('throw()', () => {
            describe('new Judgement((pass,fail)=>pass(1))(pass,fail)=>pass(1))', () => {
                test('throw(undefined)', () => {
                    const j = new Judgement((pass,fail)=>pass(1));
                    expect(j.throw()).toBe(1);
                });
                test('throw(pass)', () => {
                    const j = new Judgement((pass,fail)=>pass(1));
                    expect(j.throw(v=>v*10)).toBe(10);
                });
            });
            describe('new Judgement((pass,fail)=>pass(1))(pass,fail)=>fail(1))', () => {
                test('throw(undefined)', () => {
                    const j = new Judgement((pass,fail)=>fail(1));
                    const test = ()=>j.throw();
                    expect(test).toThrow(JudgementError);
                    expect(test).toThrow(`失敗。value:1`);
                });
                test('throw(pass)', () => {
                    const j = new Judgement((pass,fail)=>fail(1));
                    const test = ()=>j.throw(v=>v*10);
                    expect(test).toThrow(JudgementError);
                    expect(test).toThrow(`失敗。value:1`);
                });
            });
            describe(`new Judgement((pass,fail)=>pass(1))(pass,fail)=>fail(new Error('X')))`, () => {
                test('throw(undefined)', () => {
                    const cause = new Error('X');
                    const j = new Judgement((pass,fail)=>fail(cause));
                    try {j.throw(); expect.unreachable();} catch (e) {
                        console.log('e.cause: ',e.cause);
                        console.log('e: ',e.toString());
                        expect(e).toBeInstanceOf(JudgementError);
                        expect(e.message).toBe('失敗。');
                        expect(e.cause).toBe(cause); 
                        expect(e.cause.message).toBe(cause.message);
                    }
                });
                test('throw(pass)', () => {
                    const cause = new Error('X');
                    const j = new Judgement((pass,fail)=>fail(cause));
                    expect(()=>j.throw(v=>v*10)).toThrow(new JudgementError(`失敗。`, { cause }));
                });
            });
        });
        describe('judge()', () => {
            describe('new Judgement((pass,fail)=>pass(1))(pass,fail)=>pass(1))', () => {
                test('judge(undefined, undefined)', () => {
                    const j = new Judgement((pass,fail)=>pass(1));
                    const target = ()=>j.judge();
                    expect(target).toThrow(TypeError);
                    expect(target).toThrow(`passは関数であるべきです。`);
                });
                test('judge(undefined, fail)', () => {
                    const j = new Judgement((pass,fail)=>pass(1));
                    const target = ()=>j.judge(undefined, e=>{throw e});
                    expect(target).toThrow(TypeError);
                    expect(target).toThrow(`passは関数であるべきです。`);
                });
                test('judge(pass, undefined)', () => {
                    const j = new Judgement((pass,fail)=>pass(1));
                    const target = ()=>j.judge(v=>v);
                    expect(target).toThrow(TypeError);
                    expect(target).toThrow(`failは関数であるべきです。`);
                });
                test('judge(pass, fail)', () => {
                    const j = new Judgement((pass,fail)=>pass(1));
                    const r = j.judge(v=>v, e=>{throw e});
                    expect(r).toBe(1);
                });
            });
            describe('new Judgement((pass,fail)=>pass(1))(pass,fail)=>fail(1))', () => {
                test('judge(undefined, undefined)', () => {
                    const j = new Judgement((pass,fail)=>fail(1));
                    const target = ()=>j.judge();
                    expect(target).toThrow(TypeError);
                    expect(target).toThrow(`passは関数であるべきです。`);
                });
                test('judge(undefined, fail)', () => {
                    const j = new Judgement((pass,fail)=>fail(1));
                    const target = ()=>j.judge(undefined, e=>{throw e});
                    expect(target).toThrow(TypeError);
                    expect(target).toThrow(`passは関数であるべきです。`);
                });
                test('judge(pass, undefined)', () => {
                    const j = new Judgement((pass,fail)=>fail(1));
                    const target = ()=>j.judge(v=>v);
                    expect(target).toThrow(TypeError);
                    expect(target).toThrow(`failは関数であるべきです。`);
                });
                test('judge(pass, fail(1))', () => {
                    const j = new Judgement((pass,fail)=>fail(1));
                    const r = j.judge(v=>v, e=>{throw e});
                    expect(r).toBe(1);
                });
                test(`judge(pass, fail(new Error('X')))`, () => {
//                    const j = new Judgement((pass,fail)=>fail(new Error('X')));
//                    const r = j.judge(v=>v, e=>{throw e});
//                    expect(r).toBe(1);

                    const cause = new Error('X');
                    const j = new Judgement((pass,fail)=>fail(cause));
                    try {j.throw(); expect.unreachable();} catch (e) {
                        expect(e).toBeInstanceOf(JudgementError);
                        expect(e.message).toBe('失敗。');
                        expect(e.cause).toBe(cause); 
                        expect(e.cause.message).toBe(cause.message);
                    }

                });
            });
        });


        describe('pass()', () => {
            describe('new Judgement((pass,fail)=>pass(1))(pass,fail)=>pass(1))', () => {
                test('pass(undefined)', () => {
                    const j = new Judgement((pass,fail)=>pass(1));
                    const target = ()=>j.pass();
                    expect(target).toThrow(TypeError);
                    expect(target).toThrow(`fnは関数であるべきです。`);
                });
                test('pass(fn)', () => {
                    const j = new Judgement((pass,fail)=>pass(1));
                    j.pass(v=>{
                        expect(v).toBe(1);
                    });
                });
            });
            describe('new Judgement((pass,fail)=>pass(1))(pass,fail)=>fail(1))', () => {
                test('pass(undefined)', () => {
                    const j = new Judgement((pass,fail)=>fail(1));
                    const target = ()=>j.pass();
                    expect(target).toThrow(TypeError);
                    expect(target).toThrow(`fnは関数であるべきです。`);
                });
                test('pass(fn)', () => {
                    const j = new Judgement((pass,fail)=>fail(1));
                    const m = mock(v=>{});
                    j.pass(m);
                    expect(m).not.toHaveBeenCalled();
                });
            });
        });
        describe('fail()', () => {
            describe('new Judgement((pass,fail)=>pass(1))(pass,fail)=>pass(1))', () => {
                test('fail(undefined)', () => {
                    const j = new Judgement((pass,fail)=>pass(1));
                    const target = ()=>j.fail();
                    expect(target).toThrow(TypeError);
                    expect(target).toThrow(`fnは関数であるべきです。`);
                });
                test('fail(fn)', () => {
                    const j = new Judgement((pass,fail)=>pass(1));
                    const m = mock(v=>{});
                    j.fail(m);
                    expect(m).not.toHaveBeenCalled();
                });
            });
            describe('new Judgement((pass,fail)=>pass(1))(pass,fail)=>fail(1))', () => {
                test('fail(undefined)', () => {
                    const j = new Judgement((pass,fail)=>fail(1));
                    const target = ()=>j.fail();
                    expect(target).toThrow(TypeError);
                    expect(target).toThrow(`fnは関数であるべきです。`);
                });
                test('fail(fn)', () => {
                    const j = new Judgement((pass,fail)=>fail(1));
                    j.fail(v=>{
                        expect(v).toBe(1);
                    });
                });
            });
        });
        describe('any()', () => {
            describe('new Judgement((pass,fail)=>pass(1))(pass,fail)=>pass(1))', () => {
                test('any(undefined)', () => {
                    const j = new Judgement((pass,fail)=>pass(1));
                    const target = ()=>j.any();
                    expect(target).toThrow(TypeError);
                    expect(target).toThrow(`fnは関数であるべきです。`);
                });
                test('any(fn)', () => {
                    const j = new Judgement((pass,fail)=>pass(1));
                    j.any(v=>{
                        expect(v).toBe(1);
                    });
                });
            });
            describe('new Judgement((pass,fail)=>pass(1))(pass,fail)=>fail(1))', () => {
                test('any(undefined)', () => {
                    const j = new Judgement((pass,fail)=>fail(1));
                    const target = ()=>j.any();
                    expect(target).toThrow(TypeError);
                    expect(target).toThrow(`fnは関数であるべきです。`);
                });
                test('any(fn)', () => {
                    const j = new Judgement((pass,fail)=>fail(1));
                    j.any(v=>{
                        expect(v).toBe(1);
                    });
                });
            });
        });

        /*
        describe('judge()', () => {
            describe('new Judgement((pass,fail)=>pass(1))(pass,fail)=>pass(1))', () => {
                describe('judge(undefined, undefined)', () => {
                    const j = new Judgement((pass,fail)=>pass(1));
                    const target = ()=>j.judge();
                    expect(target).toBe(1);
//                    expect(target).toThrow(TypeError);
//                    expect(target).toThrow(`passは関数であるべきです。`);
                });
                describe('judge(undefined, fail)', () => {
                    const j = new Judgement((pass,fail)=>pass(1));
                    const target = ()=>j.judge(undefined, e=>{throw e});
                    expect(target).toThrow(TypeError);
                    expect(target).toThrow(`passは関数であるべきです。`);
                });
                describe('judge(pass, undefined)', () => {
                    const j = new Judgement((pass,fail)=>pass(1));
                    const target = ()=>j.judge(v=>v);
                    expect(target).toThrow(TypeError);
                    expect(target).toThrow(`failは関数であるべきです。`);
                });
                describe('judge(pass, fail)', () => {
                    const j = new Judgement((pass,fail)=>pass(1));
                    const target = ()=>j.judge(undefined, e=>{throw e});
                    expect(target).toThrow(TypeError);
                    expect(target).toThrow(`passは関数であるべきです。`);
                });
            });
        });
        */
    });
});

