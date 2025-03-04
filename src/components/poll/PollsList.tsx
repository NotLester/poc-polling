import { Poll } from '@/types';

import { EmptyState } from './EmptyState';
import { PollCard } from './PollCard';

interface PollsListProps {
  polls: Poll[];
  emptyStateType: "active" | "inactive";
}

export const PollsList: React.FC<PollsListProps> = ({polls, emptyStateType}) => {
  if (polls.length === 0) {
    return <EmptyState type={emptyStateType} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {polls.map(poll => (
        <PollCard key={poll._id} poll={poll} />
      ))}
    </div>
  );
};
