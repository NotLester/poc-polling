"use client";

import { useQuery } from 'convex/react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@clerk/nextjs';

import { api } from '../../convex/_generated/api';

export default function Home() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const activePolls = useQuery(api.queries.getActivePolls);
  const expiredPolls = useQuery(api.queries.getExpiredPolls);

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <main className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Polls</h1>
        {isSignedIn && (
          <Button onClick={() => router.push("/create")}>Create Poll</Button>
        )}
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">Active Polls</TabsTrigger>
          <TabsTrigger value="expired">Expired Polls</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activePolls?.map((poll) => (
              <Card
                key={poll._id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => router.push(`/poll/${poll._id}`)}
              >
                <CardHeader>
                  <CardTitle>{poll.title}</CardTitle>
                  <CardDescription>
                    Ends: {new Date(poll.endDate).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    {poll.questions.length} question(s)
                  </p>
                </CardContent>
              </Card>
            ))}
            {activePolls?.length === 0 && (
              <p className="text-gray-500">No active polls found.</p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="expired">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {expiredPolls?.map((poll) => (
              <Card
                key={poll._id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => router.push(`/poll/${poll._id}`)}
              >
                <CardHeader>
                  <CardTitle>{poll.title}</CardTitle>
                  <CardDescription>
                    Ended: {new Date(poll.endDate).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    {poll.questions.length} question(s)
                  </p>
                </CardContent>
              </Card>
            ))}
            {expiredPolls?.length === 0 && (
              <p className="text-gray-500">No expired polls found.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}
