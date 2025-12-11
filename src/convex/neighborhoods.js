import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { neighborhoodSeed } from "./seedData";

export const list = query({
  handler: async ({ db }) => {
    return await db.query("neighborhoods").collect();
  },
});

export const get = query({
  args: { id: v.string() },
  handler: async ({ db }, { id }) => {
    return await db
      .query("neighborhoods")
      .withIndex("by_neighborhood_id", (q) => q.eq("id", id))
      .unique();
  },
});

export const seed = mutation({
  args: { overwrite: v.optional(v.boolean()) },
  handler: async ({ db }, { overwrite }) => {
    const existing = await db.query("neighborhoods").collect();

    if (overwrite) {
      await Promise.all(existing.map((doc) => db.delete(doc._id)));
    }

    for (const neighborhood of neighborhoodSeed) {
      const already = await db
        .query("neighborhoods")
        .withIndex("by_neighborhood_id", (q) => q.eq("id", neighborhood.id))
        .unique();

      if (!already) {
        await db.insert("neighborhoods", { ...neighborhood, createdAt: Date.now() });
      }
    }

    return { inserted: neighborhoodSeed.length, overwrite: !!overwrite };
  },
});

