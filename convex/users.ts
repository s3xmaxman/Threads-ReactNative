import {
  internalMutation,
  mutation,
  query,
  QueryCtx,
} from "./_generated/server";
import { v } from "convex/values";

export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const createUser = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    first_name: v.optional(v.string()),
    last_name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    username: v.union(v.string(), v.null()),
    bio: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    followersCount: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.db.insert("users", {
      ...args,
      username: args.username || `${args.first_name}${args.last_name}`,
    });
    return userId;
  },
});

export const getUserByClerkId = query({
  args: {
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  },
});

export const getUserById = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user;
  },
});

export const updateUser = mutation({
  args: {
    _id: v.id("users"),
    bio: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    profilePicture: v.optional(v.string()),
    pushToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getCurrentUserOrThrow(ctx);

    const { _id, ...rest } = args;
    return await ctx.db.patch(_id, rest);
  },
});

// IDENTITY CHECK
// https://docs.convex.dev/auth/database-auth#mutations-for-upserting-and-deleting-users

/**
 * 現在のユーザーを取得するクエリ
 */
export const current = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUserOrThrow(ctx);
  },
});

/**
 * Clerkからユーザーを削除する内部ミューテーション
 */
export const deleteFromClerk = internalMutation({
  args: { clerkUserId: v.string() },
  async handler(ctx, { clerkUserId }) {
    const user = await userByExternalId(ctx, clerkUserId);

    if (user !== null) {
      await ctx.db.delete(user._id);
    } else {
      console.warn(
        `ユーザーを削除できません。Clerk ユーザーID: ${clerkUserId} に対応するユーザーが存在しません`
      );
    }
  },
});

/**
 * 現在のユーザーを取得し、存在しない場合はエラーをスローする
 * @param ctx クエリコンテキスト
 * @returns ユーザーレコード
 * @throws ユーザーが見つからない場合のエラー
 */
export async function getCurrentUserOrThrow(ctx: QueryCtx) {
  const userRecord = await getCurrentUser(ctx);

  if (!userRecord) {
    throw new Error("ユーザーが見つかりません");
  }

  return userRecord;
}

/**
 * 現在のユーザーを取得する
 * @param ctx クエリコンテキスト
 * @returns ユーザーレコード、または存在しない場合はnull
 */
export async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    return null;
  }

  return await userByExternalId(ctx, identity.subject);
}

/**
 * 外部IDでユーザーを検索する
 * @param ctx クエリコンテキスト
 * @param externalId 外部ID（ClerkのユーザーID）
 * @returns ユーザーレコード、または存在しない場合はnull
 */
async function userByExternalId(ctx: QueryCtx, externalId: string) {
  return await ctx.db
    .query("users")
    .withIndex("byClerkId", (q) => q.eq("clerkId", externalId))
    .unique();
}
