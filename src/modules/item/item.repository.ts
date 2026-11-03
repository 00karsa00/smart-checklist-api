import { randomUUID } from "node:crypto";

import { assignDefined } from "../../common/utils/assign-defined";

import { CreateItemDto, UpdateItemDto } from "./dto/item.dto";
import { Item } from "./types/item.type";

export interface PaginatedItems {
  rows: Item[];
  count: number;
}

/**
 * Data access for items, always scoped by `userId`.
 *
 * Reference implementation kept in memory so the skeleton runs without a
 * table. A real module keeps this same interface and swaps the body for a
 * model from infrastructure/database (see README "Adding a module").
 */
export class ItemRepository {
  private readonly items = new Map<string, Item>();

  async findAll(
    userId: string,
    offset: number,
    limit: number,
    search?: string,
  ): Promise<PaginatedItems> {
    const term = search?.toLowerCase();
    const matches = [...this.items.values()]
      .filter((item) => item.userId === userId)
      .filter((item) => !term || item.name.toLowerCase().includes(term))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return { rows: matches.slice(offset, offset + limit), count: matches.length };
  }

  async findById(id: string, userId: string): Promise<Item | null> {
    const item = this.items.get(id);
    return item && item.userId === userId ? item : null;
  }

  async findByName(name: string, userId: string): Promise<Item | null> {
    const wanted = name.toLowerCase();
    return (
      [...this.items.values()].find(
        (item) => item.userId === userId && item.name.toLowerCase() === wanted,
      ) ?? null
    );
  }

  async create(data: CreateItemDto, userId: string): Promise<Item> {
    const now = new Date();
    const item: Item = {
      id: randomUUID(),
      name: data.name,
      description: data.description ?? null,
      userId,
      createdAt: now,
      updatedAt: now,
    };
    this.items.set(item.id, item);
    return item;
  }

  async update(id: string, userId: string, data: UpdateItemDto): Promise<Item | null> {
    const item = await this.findById(id, userId);
    if (!item) return null;

    assignDefined(item, data, ["name", "description"]);
    item.updatedAt = new Date();
    return item;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const item = await this.findById(id, userId);
    return item ? this.items.delete(id) : false;
  }
}

export const itemRepository = new ItemRepository();
