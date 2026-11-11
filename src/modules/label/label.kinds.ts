import { ERROR_CODES } from "../../common";

import { LabelKindConfig } from "./types/label.type";

export const CATEGORY: LabelKindConfig = {
  kind: "category",
  path: "/categories",
  noun: "Category",
  notFound: ERROR_CODES.CATEGORY_NOT_FOUND,
  nameTaken: ERROR_CODES.CATEGORY_NAME_TAKEN,
  suggested: [
    { name: "Home", color: "#D97706" },
    { name: "Health", color: "#16A34A" },
    { name: "Finance", color: "#2563EB" },
    { name: "Learning", color: "#9333EA" },
    { name: "Errands", color: "#0D9488" },
    { name: "Family", color: "#DB2777" },
  ],
};

export const TAG: LabelKindConfig = {
  kind: "tag",
  path: "/tags",
  noun: "Tag",
  notFound: ERROR_CODES.TAG_NOT_FOUND,
  nameTaken: ERROR_CODES.TAG_NAME_TAKEN,
  suggested: [],
};
