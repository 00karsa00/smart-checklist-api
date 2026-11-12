import { PaginatedData } from "../../../common";

export type NoteItem = { id: string; text: string; isDone: boolean; position: number };

export type Note = {
  id: string;
  title: string;
  body: string | null;
  isPinned: boolean;
  isArchived: boolean;
  /** Where it sits: a project (and that project's workspace), or a workspace alone. */
  workspaceId: string;
  projectId: string | null;
  /** The task it is about, or null. */
  taskId: string | null;
  /** That task's title, to show with the note. */
  taskTitle: string | null;
  /** Checklist items done and in all. */
  checklist: { done: number; total: number };
  createdAt: Date;
  updatedAt: Date;
};

/** GET /notes/:id: the note with its checklist. */
export type NoteDetail = Note & { items: NoteItem[] };

export type NoteList = PaginatedData<Note>;
