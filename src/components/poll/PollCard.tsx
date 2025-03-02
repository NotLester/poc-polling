import { Badge, BarChart3, Calendar, Users } from 'lucide-react';
import Link from 'next/link';

import { cn, getStatusColor, getStatusIcon } from '@/lib/utils';
import { Poll } from '@/types';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';

interface PollCardProps {
  poll: Poll;
}
export const PollCard = ({poll}: PollCardProps) => {
  const totalVotes = poll.questions.reduce(
    (t, {options}) => t + options.reduce((sum, {votes}) => sum + votes, 0),
    0
  );
  const totalOptions = poll.questions.reduce((sum, q) => sum + q.options.length, 0);
  const createdDate = new Date(poll._creationTime).toLocaleDateString();

  return (
    <Link href={`/poll/${poll._id}`}>
      <Card className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/20 overflow-hidden group">
        <div className="h-2 bg-primary/80 w-full group-hover:bg-primary transition-colors"></div>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-xl group-hover:text-primary transition-colors">
              {poll.title}
            </CardTitle>
            <Badge className={cn("flex items-center", getStatusColor(poll.status))}>
              {getStatusIcon(poll.status)}
              {poll.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="flex items-center text-sm text-muted-foreground">
              <BarChart3 className="h-4 w-4 mr-2" />
              <span>
                {poll.questions.length} question
                {poll.questions.length !== 1 ? "s" : ""}
              </span>
              <span className="mx-2">•</span>
              <span>{totalOptions} options</span>
            </div>
            {totalVotes > 0 && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="h-4 w-4 mr-2" />
                <span>
                  {totalVotes} response{totalVotes !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="border-t bg-muted/10 pt-3 pb-3 text-xs text-muted-foreground">
          <div className="flex items-center">
            <Calendar className="h-3.5 w-3.5 mr-1.5" />
            <span>Created: {createdDate}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};
