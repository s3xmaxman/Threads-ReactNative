import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { getCurrentUserOrThrow } from "./users";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

/**
 * 新しいスレッドを作成するミューテーション
 * @param {Object} args - スレッドの情報
 * @param {string} args.content - スレッドの内容
 * @param {string[]} [args.mediaFiles] - 添付メディアファイルのID配列（オプション）
 * @param {string} [args.websiteUrl] - 関連ウェブサイトのURL（オプション）
 * @param {Id} [args.threadId] - 返信先のスレッドID（オプション）
 * @returns {Promise<Object>} 作成されたスレッドオブジェクト
 */
export const addThread = mutation({
  args: {
    content: v.string(),
    mediaFiles: v.optional(v.array(v.string())),
    websiteUrl: v.optional(v.string()),
    threadId: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const message = await ctx.db.insert("messages", {
      ...args,
      userId: user._id,
      likeCount: 0,
      commentCount: 0,
      retweetCount: 0,
    });

    // プッシュ通知のトリガー
    // スレッドが返信の場合、元のスレッドのコメント数を更新
    if (args.threadId) {
      const originalThread = await ctx.db.get(args.threadId);
      await ctx.db.patch(args.threadId, {
        commentCount: (originalThread?.commentCount || 0) + 1,
      });

      //   if (originalThread?.userId) {
      //     const user = await ctx.db.get(originalThread?.userId);
      //     const pushToken = user?.pushToken;

      //     if (!pushToken) return;

      //     await ctx.scheduler.runAfter(500, internal.push.sendPushNotification, {
      //       pushToken,
      //       messageTitle: 'New comment',
      //       messageBody: args.content,
      //       threadId: args.threadId,
      //     });
      //   }
    }

    return message;
  },
});

/**
 * スレッド一覧を取得するクエリ
 * @param {Object} args - クエリの引数
 * @param {Object} args.paginationOpts - ページネーションオプション
 * @param {Id} [args.userId] - 特定ユーザーのスレッドのみを取得する場合のユーザーID
 * @returns {Promise<Object>} ページネーションされたスレッド一覧
 */
export const getThreads = query({
  args: {
    paginationOpts: paginationOptsValidator,
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let threads;
    if (args.userId) {
      threads = await ctx.db
        .query("messages")
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .order("desc")
        .paginate(args.paginationOpts);
    } else {
      threads = await ctx.db
        .query("messages")
        .filter((q) => q.eq(q.field("threadId"), undefined))
        .order("desc")
        .paginate(args.paginationOpts);
    }

    const threadsWithMedia = await Promise.all(
      threads.page.map(async (thread) => {
        const creator = await getMessageCreator(ctx, thread.userId);
        const mediaUrls = await getMediaUrls(ctx, thread.mediaFiles);

        return {
          ...thread,
          mediaFiles: mediaUrls,
          creator,
        };
      })
    );

    return {
      ...threads,
      page: threadsWithMedia,
    };
  },
});

/**
 * スレッドにいいねを追加するミューテーション
 * @param {Object} args - ミューテーションの引数
 * @param {Id} args.messageId - いいねするスレッドのID
 */
export const likeThread = mutation({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    await getCurrentUserOrThrow(ctx);

    const message = await ctx.db.get(args.messageId);

    await ctx.db.patch(args.messageId, {
      likeCount: (message?.likeCount || 0) + 1,
    });
  },
});

/**
 * 特定のスレッドを取得するクエリ
 * @param {Object} args - クエリの引数
 * @param {Id} args.messageId - 取得するスレッドのID
 * @returns {Promise<Object|null>} スレッドオブジェクトまたはnull
 */
export const getThreadById = query({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) return null;

    const creator = await getMessageCreator(ctx, message.userId);
    const mediaUrls = await getMediaUrls(ctx, message.mediaFiles);

    return {
      ...message,
      mediaFiles: mediaUrls,
      creator,
    };
  },
});

/**
 * スレッドのコメント一覧を取得するクエリ
 * @param {Object} args - クエリの引数
 * @param {Id} args.messageId - コメントを取得するスレッドのID
 * @returns {Promise<Array>} コメントの配列
 */
export const getThreadComments = query({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("threadId"), args.messageId))
      .order("desc")
      .collect();

    const commentsWithMedia = await Promise.all(
      comments.map(async (comment) => {
        const creator = await getMessageCreator(ctx, comment.userId);
        const mediaUrls = await getMediaUrls(ctx, comment.mediaFiles);

        return {
          ...comment,
          mediaFiles: mediaUrls,
          creator,
        };
      })
    );

    return commentsWithMedia;
  },
});

/**
 * メッセージの作成者情報を取得する内部ヘルパー関数
 * @param {QueryCtx} ctx - クエリコンテキスト
 * @param {Id} userId - ユーザーID
 * @returns {Promise<Object>} ユーザー情報（プロフィール画像URLを含む）
 */
const getMessageCreator = async (ctx: QueryCtx, userId: Id<"users">) => {
  const user = await ctx.db.get(userId);
  if (!user?.imageUrl || user.imageUrl.startsWith("http")) {
    return user;
  }

  const url = await ctx.storage.getUrl(user.imageUrl as Id<"_storage">);

  return {
    ...user,
    imageUrl: url,
  };
};

/**
 * メディアファイルの公開URLを取得する内部ヘルパー関数
 * @param {QueryCtx} ctx - クエリコンテキスト
 * @param {string[]} mediaFiles - メディアファイルIDの配列
 * @returns {Promise<string[]>} 公開URLの配列
 */
const getMediaUrls = async (
  ctx: QueryCtx,
  mediaFiles: string[] | undefined
) => {
  if (!mediaFiles || mediaFiles.length === 0) {
    return [];
  }

  const urlPromises = mediaFiles.map((file) =>
    ctx.storage.getUrl(file as Id<"_storage">)
  );
  const results = await Promise.allSettled(urlPromises);
  return results
    .filter(
      (result): result is PromiseFulfilledResult<string> =>
        result.status === "fulfilled"
    )
    .map((result) => result.value);
};

/**
 * メディアファイルアップロード用のURLを生成するミューテーション
 * @returns {Promise<string>} アップロード用のURL
 */
export const generateUploadUrl = mutation(async (ctx) => {
  await getCurrentUserOrThrow(ctx);

  return await ctx.storage.generateUploadUrl();
});
