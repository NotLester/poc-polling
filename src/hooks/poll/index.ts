// src/hooks/poll/index.ts

import { useQuery } from 'convex/react';

import { useUser } from '@clerk/nextjs';

import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';

export const useGetPoll = (pollId: Id<"polls">) => {
  const poll = useQuery(api.queries.getPoll, { pollId });
  const { user } = useUser();

  if (!poll) {
    return {
      isLoading: true,
      data: null,
    };
  }

  return {
    isLoading: false,
    data: {
      poll,
      userVotes: poll.questions.flatMap((q) =>
        q.votes.filter((v) => v.userId === user?.id)
      ),
      isPollActive: new Date(poll.endDate) > new Date(),
    },
  };
};

// No need for usePollQuestionListener as Convex automatically
// updates the UI when data changes

export const useUserVotesForPoll = (pollId: Id<"polls">) => {
  const { user } = useUser();
  const votes = useQuery(api.queries.getUserVotes, { pollId });

  if (!user || !votes) {
    return {
      isLoading: true,
      data: [],
    };
  }

  return {
    isLoading: false,
    data: votes,
  };
};
