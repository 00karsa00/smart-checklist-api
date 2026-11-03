import { beforeEach, describe, expect, it } from "vitest";

import { ItemRepository } from "./item.repository";
import { ItemService } from "./item.service";

const OWNER = "4b2c77c8-e65b-4232-a395-57bce4f05b86";
const OTHER = "7d77afa1-4ea8-464f-b30b-84dd884d774a";
const firstPage = { page: 1, limit: 10 };

let service: ItemService;

beforeEach(() => {
  service = new ItemService(new ItemRepository());
});

describe("ItemService", () => {
  it("creates and lists the owner's items, newest first", async () => {
    await service.createItem({ name: "First" }, OWNER);
    await new Promise((resolve) => setTimeout(resolve, 2));
    await service.createItem({ name: "Second", description: "two" }, OWNER);

    const { items, pagination } = await service.listItems(OWNER, firstPage);

    expect(items.map((item) => item.name)).toEqual(["Second", "First"]);
    expect(items[0]).toMatchObject({ description: "two", userId: OWNER });
    expect(pagination).toEqual({ page: 1, limit: 10, total: 2, totalPages: 1 });
  });

  it("pages and searches", async () => {
    for (const name of ["Apple", "Banana", "Apricot"]) await service.createItem({ name }, OWNER);

    expect((await service.listItems(OWNER, { page: 2, limit: 2 })).items).toHaveLength(1);
    expect((await service.listItems(OWNER, firstPage, "ap")).pagination.total).toBe(2);
  });

  it("never shows another user's items", async () => {
    const item = await service.createItem({ name: "Private" }, OWNER);

    expect((await service.listItems(OTHER, firstPage)).items).toEqual([]);
    await expect(service.getItemById(item.id, OTHER)).rejects.toMatchObject({
      statusCode: 404,
      code: "ITEM_NOT_FOUND",
    });
  });

  it("keeps names unique per user, ignoring case", async () => {
    await service.createItem({ name: "Groceries" }, OWNER);

    await expect(service.createItem({ name: "groceries" }, OWNER)).rejects.toMatchObject({
      statusCode: 409,
      code: "CONFLICT",
    });
    await expect(service.createItem({ name: "Groceries" }, OTHER)).resolves.toBeDefined();
  });

  it("updates only the fields sent", async () => {
    const item = await service.createItem({ name: "Old", description: "keep" }, OWNER);

    const updated = await service.updateItem(item.id, OWNER, { name: "New" });

    expect(updated).toMatchObject({ name: "New", description: "keep" });
  });

  it("deletes, then reports not found", async () => {
    const item = await service.createItem({ name: "Temp" }, OWNER);

    await expect(service.deleteItem(item.id, OWNER)).resolves.toBeNull();
    await expect(service.deleteItem(item.id, OWNER)).rejects.toMatchObject({ statusCode: 404 });
  });
});
