const typer = (() => {
  const getRawType = (v) => Object.prototype.toString.call(v).slice(8, -1);
  const getFnStr = (fn) => Function.prototype.toString.call(fn);

  const isClass = (fn) => {
    if (typeof fn !== 'function') return false;
    return /^\s*(?:\/\*[\s\S]*?\*\/|\/\/[^\r\n]*\s*)*class(?:\s+|\{)/.test(getFnStr(fn));
  };

  const isNative = (fn) => {
    if (typeof fn !== 'function') return false;
    return getFnStr(fn).includes('[native code]');
  };

  const isStrictConstructor = (fn) => {
    if (typeof fn !== 'function') return false;
    // 1. ユーザー定義 class 構文
    if (isClass(fn)) return true;
    // 2. 標準APIの疑似クラス (Date等)
    // prototypeを持ち、かつ bound（ネイティブ化されるがprototypeを失う）ではないもの
    if (isNative(fn) && fn.prototype && !fn.name.startsWith('bound ')) return true;
    return false;
  };

  return {
    name: getRawType,
    is: (target, criteria) => {
      // 1. typer.is(target, Date) のような直接指定
      if (typeof criteria === 'function' && !criteria.prototype?.hasOwnProperty('primitive')) {
        if (isStrictConstructor(criteria)) {
          return target instanceof criteria;
        }
        // プリミティブラッパー (Number, String等) の考慮
        if (criteria === Number) return typeof target === 'number';
        if (criteria === String) return typeof target === 'string';
        // ...他
      }

      // 2. typer.is(target, a => a.reference.constructor) のようなチェイン指定
      // ここで判定用DSLオブジェクト（a）を渡して実行
      const dsl = {
        primitive: {
            number: typeof target === 'number',
            // ...メソッドチェーンの実装
        },
        reference: {
          class: isClass(target),
          constructor: isStrictConstructor(target),
          callable: typeof target === 'function' && !isStrictConstructor(target),
          // ...他
        }
      };
      return criteria(dsl);
    }
  };
})();

