import { t } from "../macro.ts" with { type: "macro" };
export const throwErr = () => {
  throw new Error(t("e001"));
};


