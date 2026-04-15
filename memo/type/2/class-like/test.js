import { expect, test, describe } from "bun:test";import { ClassLike } from "./bun.js";

describe("ClassLike.is - 徹底検証", () => {
    
    describe("1. Literal Class (様々なコメント・改行パターン)", () => {
        test("標準的なクラス", () => {
            class A {}
            expect(ClassLike.is(A)).toBe(true);
        });

        test("JSDocとメソッドを持つ複数行クラス", () => {
            /**
             * Test Class
             */
            class B {
                /** constructor */
                constructor() {
                    this.state = true;
                }
                /** method */
                render() {
                    return `<div></div>`;
                }
            }
            expect(ClassLike.is(B)).toBe(true);
        });

        test("複雑なファイル先頭コメントと複数行コメント", () => {
            /* 
               License...
               Author...
            */
            // Class description
            class C {
                /* method 
                   description */
                exec() {}
            }
            expect(ClassLike.is(C)).toBe(true);
        });

        test("匿名クラスとインラインコメント", () => {
            expect(ClassLike.is(/* comment */ class {})).toBe(true);
            expect(ClassLike.is(class /* name */ {})).toBe(true);
        });
    });

    describe("2. Dynamic / Native / Bound", () => {
        test("new Functionによる動的生成 (ASI回避済み)", () => {
            const dynamic = new Function("return class Dynamic {} // comment \n")();
            expect(ClassLike.is(dynamic)).toBe(true);
        });

        test("Native Constructor", () => {
            expect(ClassLike.is(String)).toBe(true);
            expect(ClassLike.is(Number)).toBe(true);
            expect(ClassLike.is(BigInt)).toBe(true);
            expect(ClassLike.is(Boolean)).toBe(true);
            expect(ClassLike.is(Symbol)).toBe(true);
            expect(ClassLike.is(Map)).toBe(true);
            expect(ClassLike.is(Promise)).toBe(true);
        });

        test("Bound化されたコンストラクタ (false判定すべき)", () => {
            expect(ClassLike.is(String.bind(null))).toBe(false);
            expect(ClassLike.is((class {}).bind(null))).toBe(false);
        });
    });

    describe("3. 誤検知防止 (False cases)", () => {
        test("関数体内に 'class' 文字列を持つ普通の関数", () => {
            const fn = function() {
                const code = "class Fake {}";
                return code;
            };
            expect(ClassLike.is(fn)).toBe(false);
        });

        test("ES5形式の疑似クラス (false判定仕様)", () => {
            function OldClass() {
                this.a = 1;
            }
            OldClass.prototype.method = function() {};
            expect(ClassLike.is(OldClass)).toBe(false);
        });

        test("アロー関数とメソッド定義", () => {
            expect(ClassLike.is(() => {})).toBe(false);
            const obj = { method() {} };
            expect(ClassLike.is(obj.method)).toBe(false);
        });
    });

    describe("4. 特殊メソッド検証", () => {
        test("isClass() - class構文のみを抽出", () => {
            expect(ClassLike.isClass(class {})).toBe(true);
            expect(ClassLike.isClass(String)).toBe(false);
        });

        test("isApi() - Native APIのみを抽出", () => {
            expect(ClassLike.isApi(String)).toBe(true);
            expect(ClassLike.isApi(class {})).toBe(false);
        });
    });
});

