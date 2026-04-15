export class ClassLike {
    static is(v) {
        if (this.#isNotFn(v)) return false;
        const s = Function.prototype.toString.call(v);
        return this.#isApi(v, s) || this.#isClass(v, s);
    }
    static isClass(v) {
        if (this.#isNotFn(v)) return false;
        const s = Function.prototype.toString.call(v);
        return this.#isClass(v, s);
    }
    static isApi(v) {
        if (this.#isNotFn(v)) return false;
        const s = Function.prototype.toString.call(v);
        return this.#isApi(v, s);
    }
    static #isNotFn(v) { return typeof v !== 'function'; }
    static #isApi(v, s) {
        return s.includes('[native code]') && v.prototype !== undefined && !v.name.startsWith('bound ');
    }
    static #isClass(v, s) {
        const cleanStr = s
            .replace(/\/\*[\s\S]*?\*\//g, ' ')
            .replace(/\/\/.*/g, ' ')
            .trim();
        return /^class\b/.test(cleanStr);
    }
}
