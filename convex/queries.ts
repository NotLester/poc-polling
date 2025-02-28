import { v } from 'convex/values';

import { query } from './_generated/server';

export const getPolls = query({
  async handler(ctx) {
    const identity = await ctx.auth.getUserIdentity();

    // If user is authenticated, include their unpublished polls
    const polls = identity
      ? await ctx.db
          .query("polls")
          .filter((q) =>
            q.or(
              q.eq(q.field("status"), "published"),
              q.and(
                q.eq(q.field("userId"), identity.subject),
                q.neq(q.field("status"), "inactive")
              )
            )
          )
          .order("desc")
          .collect()
      : await ctx.db
          .query("polls")
          .filter((q) => q.eq(q.field("status"), "published"))
          .order("desc")
          .collect();

    return Promise.all(
      polls.map(async (poll) => {
        const questions = await ctx.db
          .query("pollQuestions")
          .withIndex("by_poll_order")
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
    const identity = await ctx.auth.getUserIdentity();
    const poll = await ctx.db.get(args.pollId);
    if (!poll) return null;

    const isPollCreator = identity?.subject === poll.userId;

    // Only allow access to published polls or if user is the creator
    if (!isPollCreator && poll.status !== "published") {
      return null;
    }

    const questions = await ctx.db
      .query("pollQuestions")
      .withIndex("by_poll_order")
      .filter((q) => q.eq(q.field("pollId"), args.pollId))
      .collect();

    // Filter out inactive questions for non-creators
    const filteredQuestions = isPollCreator
      ? questions
      : questions.filter((q) => q.status === "published");

    const questionsWithOptions = await Promise.all(
      filteredQuestions.map(async (question) => {
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
