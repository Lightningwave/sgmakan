import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  cafes: defineTable({
    id: v.string(),
    title: v.string(),
    location: v.string(),
    rating: v.string(),
    price: v.string(),
    status: v.string(),
    mrt: v.optional(v.string()),
    vibe: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    description: v.string(),
    image: v.optional(v.string()),
    createdAt: v.optional(v.number()),
  }).index("by_cafe_id", ["id"]),

  neighborhoods: defineTable({
    id: v.string(),
    name: v.string(),
    icon: v.string(),
    image: v.optional(v.string()),
    description: v.optional(v.string()),
    createdAt: v.optional(v.number()),
  }).index("by_neighborhood_id", ["id"]),
});

