import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  polls: defineTable({
    title: v.string(),
    status: v.string(), // "published", "unpublished", or "inactive"
    userId: v.string(),
    createdAt: v.string(),
  }),

  pollQuestions: defineTable({
    pollId: v.id("polls"),
    text: v.string(),
    status: v.optional(v.string()), // "published" or "inactive"
    order: v.optional(v.float64()), // to maintain question order
    createdAt: v.string(),
  }).index("by_poll_order", ["pollId", "order"]),

  pollOptions: defineTable({
    questionId: v.id("pollQuestions"),
    pollId: v.id("polls"),
    text: v.string(),
    votes: v.number(),
    createdAt: v.string(),
  }),

  pollLogs: defineTable({
    pollId: v.id("polls"),
    questionId: v.id("pollQuestions"),
    optionId: v.id("pollOptions"),
    userId: v.string(),
    createdAt: v.string(),
  }),
});
