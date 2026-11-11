import { LabelModel } from "../../infrastructure/database";

import { CreateLabelDto, UpdateLabelDto } from "./dto/label.dto";
import { Label, LabelKind } from "./types/label.type";

function toLabel(row: LabelModel): Label {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    isArchived: row.isArchived,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** Categories and tags, always scoped by `userId` and kind. */
export class LabelRepository {
  async findAll(userId: string, kind: LabelKind, includeArchived: boolean): Promise<Label[]> {
    const rows = await LabelModel.findAll({
      where: { userId, kind, ...(!includeArchived && { isArchived: false }) },
      order: [["name", "ASC"]],
    });
    return rows.map(toLabel);
  }

  async findById(id: string, userId: string, kind: LabelKind): Promise<Label | null> {
    const row = await LabelModel.findOne({ where: { id, userId, kind } });
    return row ? toLabel(row) : null;
  }

  async create(userId: string, kind: LabelKind, data: CreateLabelDto): Promise<Label> {
    return toLabel(await LabelModel.create({ ...data, userId, kind }));
  }

  /** Add several; names the user already has are skipped. */
  async addMissing(
    userId: string,
    kind: LabelKind,
    items: readonly CreateLabelDto[],
  ): Promise<void> {
    await LabelModel.bulkCreate(
      items.map((item) => ({ ...item, userId, kind })),
      { ignoreDuplicates: true },
    );
  }

  async update(id: string, userId: string, kind: LabelKind, changes: UpdateLabelDto) {
    await LabelModel.update(changes, { where: { id, userId, kind } });
  }

  async delete(id: string, userId: string, kind: LabelKind): Promise<void> {
    await LabelModel.destroy({ where: { id, userId, kind } });
  }
}

export const labelRepository = new LabelRepository();
