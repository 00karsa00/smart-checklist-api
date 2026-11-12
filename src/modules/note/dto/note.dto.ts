export type CreateNoteDto = {
  title: string;
  body?: string | null;
  /** A project, or a workspace; neither: the user's first workspace. */
  projectId?: string | null;
  workspaceId?: string;
  taskId?: string | null;
  isPinned?: boolean;
  /** Checklist items to start with, in order. */
  items?: string[];
};

export type UpdateNoteDto = Omit<Partial<CreateNoteDto>, "items"> & { isArchived?: boolean };

export type CreateNoteItemDto = { text: string };
export type UpdateNoteItemDto = { text?: string; isDone?: boolean };

export type NoteListQuery = {
  page?: string;
  limit?: string;
  workspaceId?: string;
  projectId?: string;
  taskId?: string;
  q?: string;
  includeArchived?: string;
};
