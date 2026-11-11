import { ErrorCode } from "../../../common";

export const LABEL_KINDS = ["category", "tag"] as const;
export type LabelKind = (typeof LABEL_KINDS)[number];

/** A category (one per task) or a tag (any number per task). */
export type Label = {
  id: string;
  name: string;
  /** #RRGGBB, or null. */
  color: string | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/** What differs between categories and tags: their words and error codes. */
export type LabelKindConfig = {
  kind: LabelKind;
  /** The API path, e.g. "/categories". */
  path: string;
  /** "Category", "Tag": for messages and the id guard. */
  noun: string;
  notFound: ErrorCode;
  nameTaken: ErrorCode;
  /** Offered with POST <path>/suggested; none for tags. */
  suggested: readonly { name: string; color: string }[];
};
