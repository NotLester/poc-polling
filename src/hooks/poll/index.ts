// src/hooks/poll/index.ts

import { useEffect } from 'react';

import { getUserVotesForPoll } from '@/lib/actions/poll';
import { createClient } from '@/lib/supabase/client';
import { isPollActive } from '@/lib/utils';
import { IPollLog } from '@/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const useGetPoll = (poll_id: string) => {
  const supabase = createClient();

  return useQuery({
    queryKey: ["poll-" + poll_id],
    queryFn: async () => {
      // Fetch the poll with all its questions and options
      const {data: pollData} = await supabase
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
        .eq("id", poll_id)
        .single();

      if (!pollData) {
        throw new Error("Poll not found");
      }

      // Get user's auth data
      const {data: authData} = await supabase.auth.getUser();
      const userId = authData?.user?.id;

      // If user is logged in, fetch their votes for this poll
      let userVotes: IPollLog[] = [];
      if (userId) {
        const {data: votes} = await supabase
          .from("poll_log")
          .select("*")
          .eq("poll_id", poll_id)
          .eq("user_id", userId);

        userVotes = votes || [];
      }

      return {
        poll: pollData,
        userVotes,
        isPollActive: isPollActive(pollData?.end_date ?? ""),
      };
    },
    staleTime: Infinity,
  });
};

export const usePollQuestionListner = (poll_id: string) => {
  const supabase = createClient();
  const queryClient = useQueryClient();

  useEffect(() => {
    const channels = supabase
      .channel("custom-update-channel")
      .on(
        "postgres_changes",
        {event: "UPDATE", schema: "public", table: "poll_option"},
        payload => {
          queryClient.invalidateQueries({
            queryKey: ["poll-" + poll_id],
          });
        }
      )
      .subscribe();

    return () => {
      channels.unsubscribe();
    };
  }, [poll_id, queryClient, supabase]);

  return;
};

export const useUserVotesForPoll = (pollId: string, userId?: string) => {
  return useQuery({
    queryKey: ["user-votes", pollId, userId],
    queryFn: async () => {
      if (!userId) return [];

      const {data} = await getUserVotesForPoll(pollId, userId);
      return data || [];
    },
    enabled: !!userId,
    staleTime: Infinity,
  });
};
