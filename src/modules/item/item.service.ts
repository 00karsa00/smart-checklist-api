import {
  AppError,
  buildPaginatedData,
  ERROR_CODES,
  pageOffset,
  PageRequest,
  PaginatedData,
} from "../../common";

import { CreateItemDto, UpdateItemDto } from "./dto/item.dto";
import { Item } from "./types/item.type";
import { ItemRepository, itemRepository } from "./item.repository";

/**
 * Item business rules. Takes plain values (never the request) and returns
 * plain data. The repository is passed in so tests can use a fresh one.
 */
export class ItemService {
  constructor(private readonly items: ItemRepository = itemRepository) {}

  async listItems(
    userId: string,
    page: PageRequest,
    search?: string,
  ): Promise<PaginatedData<Item>> {
    const { rows, count } = await this.items.findAll(userId, pageOffset(page), page.limit, search);
    return buildPaginatedData(rows, { ...page, total: count });
  }

  async getItemById(id: string, userId: string): Promise<Item> {
    const item = await this.items.findById(id, userId);

    if (!item) {
      throw new AppError(404, ERROR_CODES.ITEM_NOT_FOUND, "Item not found.");
    }

    return item;
  }

  async createItem(data: CreateItemDto, userId: string): Promise<Item> {
    await this.assertNameFree(data.name, userId);
    return this.items.create(data, userId);
  }

  async updateItem(id: string, userId: string, data: UpdateItemDto): Promise<Item> {
    const existing = await this.getItemById(id, userId);

    if (data.name !== undefined && data.name !== existing.name) {
      await this.assertNameFree(data.name, userId);
    }

    return (await this.items.update(id, userId, data)) as Item;
  }

  async deleteItem(id: string, userId: string): Promise<null> {
    await this.getItemById(id, userId);
    await this.items.delete(id, userId);
    return null;
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  /** Names are unique per user (case-insensitive). */
  private async assertNameFree(name: string, userId: string): Promise<void> {
    if (await this.items.findByName(name, userId)) {
      throw new AppError(409, ERROR_CODES.CONFLICT, "An item with this name already exists.");
    }
  }
}

export const itemService = new ItemService();
