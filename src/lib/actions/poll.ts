"use server";

import { redirect } from 'next/navigation';

import { MultiQuestionPollFormData, VoteSubmission } from '@/types';

import { createClient } from '../supabase/server';

export async function ActivePollLists() {
  const supabase = createClient();

  // Get active polls with their questions and options
  const {data, error} = await supabase
    .from("poll")
    .select(
      `
      *,
      questions:poll_question(
        *,
        options:poll_option(*)
      )
    `
    )
    .filter("end_date", "gte", new Date().toISOString())
    .order("created_at", {ascending: true});

  if (error) {
    console.error("Error fetching active polls:", error);
    return {data: [], error};
  }

  return {data, error};
}

export async function ExpiredPollsList() {
  const supabase = createClient();

  // Get expired polls with their questions and options
  const {data, error} = await supabase
    .from("poll")
    .select(
      `
      *,
      questions:poll_question(
        *,
        options:poll_option(*)
      )
    `
    )
    .filter("end_date", "lte", new Date().toISOString())
    .order("created_at", {ascending: true});

  if (error) {
    console.error("Error fetching expired polls:", error);
    return {data: [], error};
  }

  return {data, error};
}

// Legacy function for backward compatibility
export const createPoll = async (payload: {
  title: string;
  end_date: Date;
  poll_options: string[];
  description?: string;
}): Promise<void> => {
  const supabase = createClient();

  const {data: pollId, error} = await supabase.rpc("create_poll", {
    title: payload.title,
    end_date: new Date(payload.end_date).toISOString(),
    options: payload.poll_options,
    description: payload.description ?? "",
  });

  if (error) {
    console.error("Error creating poll:", error);
    throw new Error("Failed to create poll");
  } else {
    redirect("/poll/" + pollId);
  }
};

export const createPollWithQuestions = async (
  payload: MultiQuestionPollFormData
): Promise<void> => {
  const supabase = createClient();

  // Format the questions for the RPC function
  const formattedQuestions = payload.questions.map(q => ({
    question_text: q.question_text,
    options: q.options,
  }));

  // Call the RPC with parameters in the correct order
  const {data: pollId, error} = await supabase.rpc(
    "create_poll_with_questions",
    {
      title: payload.title,
      end_date: new Date(payload.end_date).toISOString(),
      description: payload.description ?? "",
      questions: formattedQuestions,
    }
  );

  if (error) {
    console.error("Error creating multi-question poll:", error);
    throw new Error("Failed to create poll: " + error.message);
  } else {
    redirect("/poll/" + pollId);
  }
};

// Legacy function for backward compatibility
export const updatePoll = async (payload: {
  update_id: string;
  option_name: string;
}) => {
  const supabase = createClient();

  return supabase.rpc("update_poll", {
    update_id: payload.update_id,
    option_name: payload.option_name,
  });
};

// New function to vote on a specific question
export const voteOnQuestion = async (payload: VoteSubmission) => {
  const supabase = createClient();

  return supabase.rpc("vote_on_question", {
    question_id: payload.question_id,
    option_text: payload.option, // Change this from option_name to option_text
  });
};

export const deletePoll = async (pollId: string) => {
  const supabase = createClient();

  return supabase.from("poll").delete().eq("id", pollId);
};

export const updatePollDetails = async (
  payload: {
    title: string;
    end_date: Date;
    description?: string;
  },
  pollId: string
) => {
  const supabase = createClient();

  return supabase
    .from("poll")
    .update({
      title: payload.title,
      end_date: new Date(payload.end_date).toISOString(),
      description: payload.description ?? "",
    })
    .eq("id", pollId);
};

// Get a poll with all its questions and options
export async function getPollWithQuestions(pollId: string) {
  const supabase = createClient();

  const {data, error} = await supabase
    .from("poll")
    .select(
      `
      *,
      questions:poll_question(
        *,
        options:poll_option(*)
      ),
      users(*)
    `
    )
    .eq("id", pollId)
    .single();

  if (error) {
    console.error("Error fetching poll with questions:", error);
    throw new Error("Failed to fetch poll");
  }

  return {data, error};
}

// Get user votes for a poll
export async function getUserVotesForPoll(pollId: string, userId: string) {
  const supabase = createClient();

  const {data, error} = await supabase
    .from("poll_log")
    .select(`*`)
    .eq("poll_id", pollId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching user votes:", error);
    return {data: [], error};
  }

  return {data, error};
}
