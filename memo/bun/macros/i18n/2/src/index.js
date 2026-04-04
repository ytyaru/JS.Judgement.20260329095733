import { t } from "../macro.js" with { type: "macro" };
export const throwErr = () => {
  //throw new Error(t("e00X"));
  throw new Error(t("err.msg.e001"));
};


