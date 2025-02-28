"use client";

import { useQuery } from 'convex/react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { api } from '../../../convex/_generated/api';

export default function PollsPage() {
  const activePolls = useQuery(api.polls.getActivePolls);
  const expiredPolls = useQuery(api.polls.getExpiredPolls);

  return (
    <div className="container mx-auto py-10">
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">Active Polls</TabsTrigger>
          <TabsTrigger value="expired">Expired Polls</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          <div className="grid gap-4 mt-4">
            {activePolls?.map((poll) => (
              <Link key={poll._id} href={`/polls/${poll._id}`}>
                <Card className="hover:bg-gray-50 transition-colors">
                  <CardHeader>
                    <CardTitle>{poll.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">
                      Ends {formatDistanceToNow(new Date(poll.endDate))} from
                      now
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {activePolls?.length === 0 && (
              <p className="text-center text-gray-500">No active polls</p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="expired">
          <div className="grid gap-4 mt-4">
            {expiredPolls?.map((poll) => (
              <Link key={poll._id} href={`/polls/${poll._id}`}>
                <Card className="hover:bg-gray-50 transition-colors">
                  <CardHeader>
                    <CardTitle>{poll.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">
                      Ended {formatDistanceToNow(new Date(poll.endDate))} ago
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {expiredPolls?.length === 0 && (
              <p className="text-center text-gray-500">No expired polls</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
