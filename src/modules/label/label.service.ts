import { AppError } from "../../common";

import { withUniqueColumns } from "../accounts";
import { CreateLabelDto, UpdateLabelDto } from "./dto/label.dto";
import { CATEGORY, TAG } from "./label.kinds";
import { labelRepository, LabelRepository } from "./label.repository";
import { Label, LabelKindConfig } from "./types/label.type";

/**
 * Categories or tags (one instance each): the same rules, different words.
 * Other modules check a label with `canUse` before attaching it to a record.
 */
export class LabelService {
  constructor(
    readonly config: LabelKindConfig,
    private readonly labels: LabelRepository = labelRepository,
  ) {}

  list(userId: string, includeArchived = false): Promise<Label[]> {
    return this.labels.findAll(userId, this.config.kind, includeArchived);
  }

  create(userId: string, data: CreateLabelDto): Promise<Label> {
    return withUniqueColumns(this.labels.create(userId, this.config.kind, data), this.taken());
  }

  async update(id: string, userId: string, data: UpdateLabelDto): Promise<Label> {
    await this.canUse(userId, id);
    await withUniqueColumns(this.labels.update(id, userId, this.config.kind, data), this.taken());
    return this.canUse(userId, id);
  }

  async delete(id: string, userId: string): Promise<null> {
    await this.canUse(userId, id);
    await this.labels.delete(id, userId, this.config.kind);
    return null;
  }

  /** Add the suggested set (skipping names the user has), then list. */
  async addSuggested(userId: string): Promise<Label[]> {
    await this.labels.addMissing(userId, this.config.kind, this.config.suggested);
    return this.list(userId);
  }

  /** The label, when the user may use it; 404 otherwise. */
  async canUse(userId: string, id: string): Promise<Label> {
    const label = await this.labels.findById(id, userId, this.config.kind);
    if (!label) throw new AppError(404, this.config.notFound, `${this.config.noun} not found.`);
    return label;
  }

  private taken() {
    const { nameTaken, noun } = this.config;
    return {
      name: () =>
        new AppError(409, nameTaken, `You already have a ${noun.toLowerCase()} with this name.`),
    };
  }
}

export const categoryService = new LabelService(CATEGORY);
export const tagService = new LabelService(TAG);
