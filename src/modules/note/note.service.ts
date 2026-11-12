import {
  AppError,
  buildPaginatedData,
  deleteChecked,
  ERROR_CODES,
  pageOffset,
  PageRequest,
} from "../../common";

import { taskService, TaskService } from "../task/task.service";
import { workspaceService, WorkspaceService } from "../workspace/workspace.service";
import { CreateNoteDto, CreateNoteItemDto, UpdateNoteDto, UpdateNoteItemDto } from "./dto/note.dto";
import { NoteFilter, noteRepository, NoteRepository, NoteRow } from "./note.repository";
import { Note, NoteDetail, NoteList } from "./types/note.type";

export type NoteListOptions = Omit<NoteFilter, "placement"> & { workspaceId?: string };

/**
 * Notes with a checklist. A note sits in a project or a workspace, like a
 * task (the workspace module decides where), and may be about a task.
 */
export class NoteService {
  constructor(
    private readonly notes: NoteRepository = noteRepository,
    private readonly workspaces: WorkspaceService = workspaceService,
    private readonly tasks: TaskService = taskService,
  ) {}

  async list(userId: string, options: NoteListOptions, page: PageRequest): Promise<NoteList> {
    const { workspaceId, ...rest } = options;
    const filter: NoteFilter = { ...rest };
    if (workspaceId) filter.placement = await this.workspaces.placesIn(userId, workspaceId);
    if (filter.taskId) await this.tasks.canUse(userId, filter.taskId);
    const { rows, count } = await this.notes.findPage(userId, filter, pageOffset(page), page.limit);
    return buildPaginatedData(await this.shape(userId, rows), { ...page, total: count });
  }

  async get(id: string, userId: string): Promise<NoteDetail> {
    const [note] = await this.shape(userId, [await this.canUse(userId, id)]);
    return { ...note, items: await this.notes.items(id) };
  }

  async create(userId: string, data: CreateNoteDto): Promise<NoteDetail> {
    const { items = [], projectId, workspaceId, ...rest } = data;
    if (rest.taskId) await this.tasks.canUse(userId, rest.taskId);
    const place = await this.workspaces.resolvePlace(userId, { projectId, workspaceId });
    const id = await this.notes.create(userId, { ...rest, ...place }, items);
    return this.get(id, userId);
  }

  async update(id: string, userId: string, data: UpdateNoteDto): Promise<NoteDetail> {
    const current = await this.canUse(userId, id);
    const { projectId, workspaceId, ...rest } = data;
    if (rest.taskId) await this.tasks.canUse(userId, rest.taskId);
    const fields = { ...rest };
    if (projectId !== undefined || workspaceId !== undefined) {
      Object.assign(
        fields,
        await this.workspaces.resolvePlace(userId, { projectId, workspaceId }, current),
      );
    }
    await this.notes.update(id, userId, fields);
    return this.get(id, userId);
  }

  delete(id: string, userId: string): Promise<null> {
    return deleteChecked(
      () => this.canUse(userId, id),
      () => this.notes.delete(id, userId),
    );
  }

  // ── Checklist ─────────────────────────────────────────────────────────────

  async addItem(id: string, userId: string, data: CreateNoteItemDto): Promise<NoteDetail> {
    await this.canUse(userId, id);
    await this.notes.addItem(id, data.text);
    await this.notes.touch(id, userId);
    return this.get(id, userId);
  }

  async updateItem(
    id: string,
    itemId: string,
    userId: string,
    data: UpdateNoteItemDto,
  ): Promise<NoteDetail> {
    await this.item(id, itemId, userId);
    await this.notes.updateItem(itemId, id, data);
    await this.notes.touch(id, userId);
    return this.get(id, userId);
  }

  async deleteItem(id: string, itemId: string, userId: string): Promise<NoteDetail> {
    await this.item(id, itemId, userId);
    await this.notes.deleteItem(itemId, id);
    await this.notes.touch(id, userId);
    return this.get(id, userId);
  }

  /** The note, when the user may use it; 404 otherwise. */
  async canUse(userId: string, id: string): Promise<NoteRow> {
    const note = await this.notes.findById(id, userId);
    if (!note) throw new AppError(404, ERROR_CODES.NOTE_NOT_FOUND, "Note not found.");
    return note;
  }

  private async item(id: string, itemId: string, userId: string) {
    await this.canUse(userId, id);
    const item = await this.notes.findItem(itemId, id);
    if (!item) {
      throw new AppError(404, ERROR_CODES.NOTE_ITEM_NOT_FOUND, "Checklist item not found.");
    }
    return item;
  }

  /** API shape: the workspace filled in, and checklist counts. */
  private async shape(userId: string, rows: NoteRow[]): Promise<Note[]> {
    if (rows.length === 0) return [];
    const taskIds = [...new Set(rows.flatMap((row) => (row.taskId ? [row.taskId] : [])))];
    const [workspaceOf, counts, tasks] = await Promise.all([
      this.workspaces.workspaceOfPlace(userId),
      this.notes.checklistCounts(rows.map((row) => row.id)),
      Promise.all(taskIds.map((id) => this.tasks.canUse(userId, id))),
    ]);
    const taskTitle = new Map(tasks.map((task) => [task.id, task.title]));
    return rows.map((row) => ({
      ...row,
      workspaceId: workspaceOf(row),
      taskTitle: row.taskId ? (taskTitle.get(row.taskId) ?? null) : null,
      checklist: counts.get(row.id) ?? { done: 0, total: 0 },
    }));
  }
}

export const noteService = new NoteService();
