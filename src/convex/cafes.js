import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { cafeSeed } from "./seedData";

export const list = query({
  handler: async ({ db }) => {
    return await db.query("cafes").collect();
  },
});

export const get = query({
  args: { id: v.string() },
  handler: async ({ db }, { id }) => {
    return await db
      .query("cafes")
      .withIndex("by_cafe_id", (q) => q.eq("id", id))
      .unique();
  },
});

export const seed = mutation({
  args: { overwrite: v.optional(v.boolean()) },
  handler: async ({ db }, { overwrite }) => {
    const existing = await db.query("cafes").collect();

    // If overwrite is true, clear and re-seed everything
    if (overwrite) {
      await Promise.all(existing.map((doc) => db.delete(doc._id)));
    }

    // Insert any missing cafes based on id
    for (const cafe of cafeSeed) {
      const already = await db
        .query("cafes")
        .withIndex("by_cafe_id", (q) => q.eq("id", cafe.id))
        .unique();

      if (!already) {
        await db.insert("cafes", { ...cafe, createdAt: Date.now() });
      }
    }

    return { inserted: cafeSeed.length, overwrite: !!overwrite };
  },
});

