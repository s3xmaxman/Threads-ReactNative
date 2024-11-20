import { Id } from "./_generated/dataModel";
import {
  internalMutation,
  mutation,
  query,
  QueryCtx,
} from "./_generated/server";
import { v } from "convex/values";

/**
 * 全てのユーザーを取得するクエリ
 * @returns {Promise<Array>} ユーザーの配列
 */
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

/**
 * 新しいユーザーを作成する内部ミューテーション
 * @param {Object} args - ユーザーの情報
 * @param {string} args.clerkId - ClerkのユーザーID
 * @param {string} args.email - ユーザーのメールアドレス
 * @param {string} [args.first_name] - ユーザーの名前（オプション）
 * @param {string} [args.last_name] - ユーザーの姓（オプション）
 * @param {string} [args.imageUrl] - ユーザーのプロフィール画像URL（オプション）
 * @param {string|null} args.username - ユーザーのユーザーネーム
 * @param {string} [args.bio] - ユーザーの自己紹介（オプション）
 * @param {string} [args.websiteUrl] - ユーザーのウェブサイトURL（オプション）
 * @param {number} args.followersCount - フォロワーの数
 * @returns {Promise<Id>} 作成されたユーザーのID
 */
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

/**
 * Clerk IDでユーザーを取得するクエリ
 * @param {Object} args - クエリの引数
 * @param {string} [args.clerkId] - ClerkのユーザーID（オプション）
 * @returns {Promise<Object|null>} ユーザーオブジェクトまたはnull
 */
export const getUserByClerkId = query({
  args: {
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), args.clerkId))
      .unique();

    if (!user?.imageUrl || user.imageUrl.startsWith("http")) {
      return user;
    }

    const url = await ctx.storage.getUrl(user.imageUrl as Id<"_storage">);

    return {
      ...user,
      imageUrl: url,
    };
  },
});

/**
 * ユーザーIDでユーザーを取得するクエリ
 * @param {Object} args - クエリの引数
 * @param {Id} args.userId - ユーザーのID
 * @returns {Promise<Object|null>} ユーザーオブジェクトまたはnull
 */
export const getUserById = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user?.imageUrl || user.imageUrl.startsWith("http")) {
      return user;
    }

    const url = await ctx.storage.getUrl(user.imageUrl as Id<"_storage">);

    return {
      ...user,
      imageUrl: url,
    };
  },
});

/**
 * ユーザー情報を更新するミューテーション
 * @param {Object} args - 更新するユーザーの情報
 * @param {Id} args._id - 更新するユーザーのID
 * @param {string} [args.bio] - ユーザーの自己紹介（オプション）
 * @param {string} [args.websiteUrl] - ユーザーのウェブサイトURL（オプション）
 * @param {string} [args.profilePicture] - ユーザーのプロフィール画像（オプション）
 * @param {string} [args.pushToken] - ユーザーのプッシュ通知トークン（オプション）
 * @returns {Promise<void>}
 */
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

/**
 * 画像アップロード用のURLを生成するミューテーション
 * @returns {Promise<string>} アップロード用のURL
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await getCurrentUserOrThrow(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * ユーザーのプロフィール画像を更新するミューテーション
 * @param {Object} args - 更新する情報
 * @param {Id} args.storageId - ストレージのID
 * @param {Id} args._id - 更新するユーザーのID
 * @returns {Promise<void>}
 */
export const updateImage = mutation({
  args: { storageId: v.id("_storage"), _id: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args._id, {
      imageUrl: args.storageId,
    });
  },
});

/**
 * ユーザーを検索するクエリ
 * @param {Object} args - クエリの引数
 * @param {string} args.search - 検索キーワード
 * @returns {Promise<Array>} 検索結果のユーザー配列
 */
export const searchUsers = query({
  args: {
    search: v.string(),
  },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .withSearchIndex("searchUsers", (q) => q.search("username", args.search))
      .collect();

    const usersWithImage = await Promise.all(
      users.map(async (user) => {
        if (!user?.imageUrl || user.imageUrl.startsWith("http")) {
          user.imageUrl;
          return user;
        }

        const url = await ctx.storage.getUrl(user.imageUrl as Id<"_storage">);
        user.imageUrl = url!;
        return user;
      })
    );

    return usersWithImage;
  },
});

// IDENTITY CHECK
// https://docs.convex.dev/auth/database-auth#mutations-for-upserting-and-deleting-users

/**
 * 現在のユーザーを取得するクエリ
 * @returns {Promise<Object|null>} 現在のユーザーオブジェクトまたはnull
 */
export const current = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUserOrThrow(ctx);
  },
});

/**
 * Clerkからユーザーを削除する内部ミューテーション
 * @param {Object} args - 削除するユーザーの情報
 * @param {string} args.clerkUserId - ClerkのユーザーID
 * @returns {Promise<void>}
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
 * @param {QueryCtx} ctx - クエリコンテキスト
 * @returns {Promise<Object>} ユーザーレコード
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
 * @param {QueryCtx} ctx - クエリコンテキスト
 * @returns {Promise<Object|null>} ユーザーレコード、または存在しない場合はnull
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
 * @param {QueryCtx} ctx - クエリコンテキスト
 * @param {string} externalId - 外部ID（ClerkのユーザーID）
 * @returns {Promise<Object|null>} ユーザーレコード、または存在しない場合はnull
 */
async function userByExternalId(ctx: QueryCtx, externalId: string) {
  return await ctx.db
    .query("users")
    .withIndex("byClerkId", (q) => q.eq("clerkId", externalId))
    .unique();
}
