import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { cafeSeed, neighborhoodSeed } from "./seedData";

// Convenience action to seed both tables in one call.
export const load = action({
  args: { overwrite: v.optional(v.boolean()) },
  handler: async (ctx, { overwrite }) => {
    await ctx.runMutation(api.cafes.seed, { overwrite });
    await ctx.runMutation(api.neighborhoods.seed, { overwrite });

    return {
      cafes: cafeSeed.length,
      neighborhoods: neighborhoodSeed.length,
      overwrite: !!overwrite,
    };
  },
});

