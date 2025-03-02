import { useConvex } from 'convex/react';

// src/hooks/poll/index.ts
import { useQuery } from '@tanstack/react-query';

import { api } from '../../../convex/_generated/api';

export const useGetPolls = () => {
  const convex = useConvex();

  const {
    data: polls,
    status: pollsStatus,
    isLoading: isPollsLoading,
  } = useQuery({
    queryKey: ["polls"],
    queryFn: async () => {
      return await convex.query(api.queries.getPolls);
    },
  });

  return {polls, pollsStatus, isPollsLoading};
};
