// i18n-ns:i18n
var data = { err: { msg: { e001: "これはエラーメッセージです" } } };
function t(path) {
  return path.split(".").reduce((obj, key) => obj?.[key], data) || path;
}

// src/index.js
var throwErr = () => {
  throw new Error(t("err.msg.e001"));
};
export {
  throwErr
};
