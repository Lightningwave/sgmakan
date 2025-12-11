import { query } from "./_generated/server";
import { v } from "convex/values";

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
