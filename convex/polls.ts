import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

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
        order: index,
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

export const updateQuestionStatus = mutation({
  args: {
    questionId: v.id("pollQuestions"),
    status: v.string(),
  },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const question = await ctx.db.get(args.questionId);
    if (!question) {
      throw new Error("Question not found");
    }

    // Get the poll to check ownership
    const poll = await ctx.db.get(question.pollId);
    if (!poll) {
      throw new Error("Poll not found");
    }

    // Only poll creator can update status
    if (poll.userId !== identity.subject) {
      throw new Error("Not authorized to update question status");
    }

    await ctx.db.patch(args.questionId, {
      status: args.status,
    });

    return true;
  },
});

export const getActivePolls = query({
  async handler(ctx) {
    const now = new Date().toISOString();
    return await ctx.db
      .query("polls")
      .filter((q) => q.gt(q.field("endDate"), now))
      .collect();
  },
});

export const getExpiredPolls = query({
  async handler(ctx) {
    const now = new Date().toISOString();
    return await ctx.db
      .query("polls")
      .filter((q) => q.lte(q.field("endDate"), now))
      .collect();
  },
});

export const getPollDetails = query({
  args: { pollId: v.id("polls") },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();
    const poll = await ctx.db.get(args.pollId);
    if (!poll) return null;

    const isPollCreator = identity?.subject === poll.userId;

    // Get questions, filtered by status for non-creators
    const questions = await ctx.db
      .query("pollQuestions")
      .withIndex("by_poll_order")
      .filter((q) => q.eq(q.field("pollId"), args.pollId))
      .collect();

    // Filter out inactive questions for non-creators
    const filteredQuestions = isPollCreator
      ? questions
      : questions.filter((q) => q.status === "published");

    // Get options for each question
    const options = await Promise.all(
      filteredQuestions.map(async (question) =>
        ctx.db
          .query("pollOptions")
          .filter((q) => q.eq(q.field("questionId"), question._id))
          .collect()
      )
    );

    return {
      ...poll,
      questions: filteredQuestions.map((question, index) => ({
        ...question,
        options: options[index],
      })),
    };
  },
});

export const vote = mutation({
  args: {
    pollId: v.id("polls"),
    questionId: v.id("pollQuestions"),
    optionId: v.id("pollOptions"),
  },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if question is published
    const question = await ctx.db.get(args.questionId);
    if (!question) {
      throw new Error("Question not found");
    }
    if (question.status !== "published") {
      throw new Error("This question is not yet published");
    }

    const userId = identity.subject;

    // Check if user has already voted
    const existingVote = await ctx.db
      .query("pollLogs")
      .filter((q) =>
        q.and(
          q.eq(q.field("pollId"), args.pollId),
          q.eq(q.field("questionId"), args.questionId),
          q.eq(q.field("userId"), userId)
        )
      )
      .first();

    if (existingVote) {
      throw new Error("Already voted");
    }

    // Record the vote
    await ctx.db.insert("pollLogs", {
      pollId: args.pollId,
      questionId: args.questionId,
      optionId: args.optionId,
      userId,
      createdAt: new Date().toISOString(),
    });

    // Increment the vote count
    const option = await ctx.db.get(args.optionId);
    if (!option) {
      throw new Error("Option not found");
    }

    await ctx.db.patch(args.optionId, {
      votes: (option.votes || 0) + 1,
    });

    return true;
  },
});
