import { v } from 'convex/values';

import { query } from './_generated/server';

export const getPolls = query({
  async handler(ctx) {
    const polls = await ctx.db.query("polls").collect();
    return Promise.all(
      polls.map(async (poll) => {
        const questions = await ctx.db
          .query("pollQuestions")
          .filter((q) => q.eq(q.field("pollId"), poll._id))
          .collect();

        const questionsWithOptions = await Promise.all(
          questions.map(async (question) => {
            const options = await ctx.db
              .query("pollOptions")
              .filter((q) => q.eq(q.field("questionId"), question._id))
              .collect();

            return {
              ...question,
              options,
            };
          })
        );

        return {
          ...poll,
          questions: questionsWithOptions,
        };
      })
    );
  },
});

export const getPoll = query({
  args: { pollId: v.id("polls") },
  async handler(ctx, args) {
    const poll = await ctx.db.get(args.pollId);
    if (!poll) return null;

    const questions = await ctx.db
      .query("pollQuestions")
      .filter((q) => q.eq(q.field("pollId"), args.pollId))
      .collect();

    const questionsWithOptions = await Promise.all(
      questions.map(async (question) => {
        const options = await ctx.db
          .query("pollOptions")
          .filter((q) => q.eq(q.field("questionId"), question._id))
          .collect();

        const votes = await ctx.db
          .query("pollLogs")
          .filter((q) => q.eq(q.field("questionId"), question._id))
          .collect();

        return {
          ...question,
          options,
          votes,
        };
      })
    );

    return {
      ...poll,
      questions: questionsWithOptions,
    };
  },
});

export const getUserVotes = query({
  args: { pollId: v.id("polls") },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return ctx.db
      .query("pollLogs")
      .filter((q) =>
        q.and(
          q.eq(q.field("pollId"), args.pollId),
          q.eq(q.field("userId"), identity.subject)
        )
      )
      .collect();
  },
});

export const getActivePolls = query({
  handler: async (ctx) => {
    const now = new Date().toISOString();
    const polls = await ctx.db
      .query("polls")
      .filter((q) => q.gt(q.field("endDate"), now))
      .order("desc")
      .collect();

    return Promise.all(
      polls.map(async (poll) => {
        const questions = await ctx.db
          .query("pollQuestions")
          .filter((q) => q.eq(q.field("pollId"), poll._id))
          .collect();

        const questionsWithOptions = await Promise.all(
          questions.map(async (question) => {
            const options = await ctx.db
              .query("pollOptions")
              .filter((q) => q.eq(q.field("questionId"), question._id))
              .collect();

            return {
              ...question,
              options,
            };
          })
        );

        return {
          ...poll,
          questions: questionsWithOptions,
        };
      })
    );
  },
});

export const getExpiredPolls = query({
  handler: async (ctx) => {
    const now = new Date().toISOString();
    const polls = await ctx.db
      .query("polls")
      .filter((q) => q.lte(q.field("endDate"), now))
      .order("desc")
      .collect();

    return Promise.all(
      polls.map(async (poll) => {
        const questions = await ctx.db
          .query("pollQuestions")
          .filter((q) => q.eq(q.field("pollId"), poll._id))
          .collect();

        const questionsWithOptions = await Promise.all(
          questions.map(async (question) => {
            const options = await ctx.db
              .query("pollOptions")
              .filter((q) => q.eq(q.field("questionId"), question._id))
              .collect();

            return {
              ...question,
              options,
            };
          })
        );

        return {
          ...poll,
          questions: questionsWithOptions,
        };
      })
    );
  },
});
