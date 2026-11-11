export type CreateLabelDto = { name: string; color?: string | null };
export type UpdateLabelDto = Partial<CreateLabelDto> & { isArchived?: boolean };
export type LabelListQuery = { includeArchived?: string };
