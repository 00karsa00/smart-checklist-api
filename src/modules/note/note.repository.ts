import {
  containsText,
  NoteItemModel,
  NoteModel,
  oneOf,
  requireAny,
  selectRows,
  withTransaction,
} from "../../infrastructure/database";

import { PlaceFilter, wherePlaced } from "../workspace/place.filter";

import { NoteItem } from "./types/note.type";

/** A note as stored, before it is shaped for the API. */
export type NoteRow = {
  id: string;
  title: string;
  body: string | null;
  isPinned: boolean;
  isArchived: boolean;
  workspaceId: string | null;
  projectId: string | null;
  taskId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type NoteFields = Partial<Omit<NoteRow, "id" | "createdAt" | "updatedAt">>;

export type NoteFilter = PlaceFilter & {
  taskId?: string;
  search?: string;
  includeArchived: boolean;
};

const toRow = (row: NoteModel): NoteRow => ({
  id: row.id,
  title: row.title,
  body: row.body,
  isPinned: row.isPinned,
  isArchived: row.isArchived,
  workspaceId: row.workspaceId,
  projectId: row.projectId,
  taskId: row.taskId,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const toItem = (row: NoteItemModel): NoteItem => ({
  id: row.id,
  text: row.text,
  isDone: row.isDone,
  position: row.position,
});

/** Notes and their checklist items, always scoped by `userId` (items through their note). */
export class NoteRepository {
  /** Pinned first, then the most recently changed. */
  async findPage(userId: string, filter: NoteFilter, offset: number, limit: number) {
    const where = wherePlaced({ userId }, filter);
    if (filter.taskId) where.taskId = filter.taskId;
    if (!filter.includeArchived) where.isArchived = false;
    if (filter.search) {
      requireAny(where, [
        { title: containsText(filter.search) },
        { body: containsText(filter.search) },
      ]);
    }
    const { rows, count } = await NoteModel.findAndCountAll({
      where,
      order: [
        ["isPinned", "DESC"],
        ["updatedAt", "DESC"],
      ],
      offset,
      limit,
    });
    return { rows: rows.map(toRow), count };
  }

  async findById(id: string, userId: string): Promise<NoteRow | null> {
    const row = await NoteModel.findOne({ where: { id, userId } });
    return row ? toRow(row) : null;
  }

  async items(noteId: string): Promise<NoteItem[]> {
    const rows = await NoteItemModel.findAll({ where: { noteId }, order: [["position", "ASC"]] });
    return rows.map(toItem);
  }

  /** Checklist items done and in all, per note. */
  async checklistCounts(noteIds: readonly string[]) {
    const counts = new Map<string, { done: number; total: number }>();
    if (noteIds.length === 0) return counts;
    const rows = await NoteItemModel.findAll({
      where: { noteId: oneOf(noteIds) },
      attributes: ["noteId", "isDone"],
    });
    for (const row of rows) {
      const count = counts.get(row.noteId) ?? { done: 0, total: 0 };
      count.total += 1;
      if (row.isDone) count.done += 1;
      counts.set(row.noteId, count);
    }
    return counts;
  }

  /** Save a note with its first checklist items; returns its id. */
  create(userId: string, fields: NoteFields & { title: string }, items: string[]) {
    return withTransaction(async (transaction) => {
      const note = await NoteModel.create({ ...fields, userId }, { transaction });
      await NoteItemModel.bulkCreate(
        items.map((text, position) => ({ noteId: note.id, text, position })),
        { transaction },
      );
      return note.id;
    });
  }

  async update(id: string, userId: string, fields: NoteFields): Promise<void> {
    await NoteModel.update(fields, { where: { id, userId } });
  }

  /** Mark the note changed (its checklist was), so it moves up the list. */
  async touch(id: string, userId: string): Promise<void> {
    // Plain SQL: the ORM skips an update that only sets its own timestamp.
    await selectRows(
      "UPDATE note SET updated_at = NOW() WHERE id = :id AND app_user_id = :userId RETURNING id",
      { id, userId },
    );
  }

  async delete(id: string, userId: string): Promise<void> {
    await NoteModel.destroy({ where: { id, userId } });
  }

  /** Add an item at the end of the checklist. */
  async addItem(noteId: string, text: string): Promise<void> {
    const last = (await NoteItemModel.max("position", { where: { noteId } })) as number | null;
    await NoteItemModel.create({ noteId, text, position: (last ?? -1) + 1 });
  }

  async findItem(id: string, noteId: string): Promise<NoteItem | null> {
    const row = await NoteItemModel.findOne({ where: { id, noteId } });
    return row ? toItem(row) : null;
  }

  async updateItem(id: string, noteId: string, changes: { text?: string; isDone?: boolean }) {
    await NoteItemModel.update(changes, { where: { id, noteId } });
  }

  async deleteItem(id: string, noteId: string): Promise<void> {
    await NoteItemModel.destroy({ where: { id, noteId } });
  }
}

export const noteRepository = new NoteRepository();
