import { expect, test, describe } from "bun:test";
import { Judgement, JudgementResult, Pass, Fail } from "./judgement.js";
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
                expect(j.result.cause).toBe(1);
            });
        });
    });
});

