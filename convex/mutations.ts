import { v } from 'convex/values';

import { mutation } from './_generated/server';

export const createPoll = mutation({
  args: {
    title: v.string(),
    endDate: v.string(),
    questions: v.array(
      v.object({
        text: v.string(),
        options: v.array(v.string()),
        status: v.string(), // "published" or "inactive"
      })
    ),
  },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;
    const pollId = await ctx.db.insert("polls", {
      title: args.title,
      endDate: args.endDate,
      userId,
      createdAt: new Date().toISOString(),
    });

    // Create questions and their options
    for (const [index, question] of args.questions.entries()) {
      const questionId = await ctx.db.insert("pollQuestions", {
        pollId,
        text: question.text,
        status: question.status,
        order: Number(index),
        createdAt: new Date().toISOString(),
      });

      // Create options for this question
      for (const option of question.options) {
        await ctx.db.insert("pollOptions", {
          questionId,
          pollId,
          text: option,
          votes: 0,
          createdAt: new Date().toISOString(),
        });
      }
    }

    return pollId;
  },
});
