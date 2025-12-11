import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Simple hash function (for demo - in production use bcrypt via an action)
function simpleHash(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

// Generate a random token
function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export const signup = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async ({ db }, { email, password }) => {
    // Check if user already exists
    const existingUser = await db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .unique();

    if (existingUser) {
      throw new Error("Email already registered");
    }

    // Create user
    const userId = await db.insert("users", {
      email: email.toLowerCase(),
      passwordHash: simpleHash(password),
      createdAt: Date.now(),
    });

    // Create session
    const token = generateToken();
    await db.insert("sessions", {
      userId,
      token,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      createdAt: Date.now(),
    });

    return { token, userId };
  },
});

export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async ({ db }, { email, password }) => {
    const user = await db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .unique();

    if (!user) {
      throw new Error("Invalid email or password");
    }

    if (user.passwordHash !== simpleHash(password)) {
      throw new Error("Invalid email or password");
    }

    // Create new session
    const token = generateToken();
    await db.insert("sessions", {
      userId: user._id,
      token,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      createdAt: Date.now(),
    });

    return { token, userId: user._id };
  },
});

export const logout = mutation({
  args: { token: v.string() },
  handler: async ({ db }, { token }) => {
    const session = await db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();

    if (session) {
      await db.delete(session._id);
    }

    return { success: true };
  },
});

export const getUser = query({
  args: { token: v.optional(v.string()) },
  handler: async ({ db }, { token }) => {
    if (!token) return null;

    const session = await db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    const user = await db.get(session.userId);
    if (!user) return null;

    return {
      id: user._id,
      email: user.email,
      name: user.name,
    };
  },
});
