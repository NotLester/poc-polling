"use client";

import { useQuery } from 'convex/react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@clerk/nextjs';

import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

interface Poll {
  _id: Id<"polls">;
  title: string;
  status: "published" | "unpublished" | "inactive";
  questions: {
    text: string;
    options: {
      text: string;
      votes: number;
    }[];
  }[];
}

export default function Home() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const polls = useQuery(api.queries.getPolls);

  if (!isLoaded || !polls) {
    return <div>Loading...</div>;
  }

  const activePolls = polls.filter((poll) => poll.status === "published");
  const inactivePolls = polls.filter((poll) => poll.status === "unpublished");

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
          <TabsTrigger value="inactive">Inactive Polls</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activePolls.map((poll) => (
              <Card
                key={poll._id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => router.push(`/poll/${poll._id}`)}
              >
                <CardHeader>
                  <CardTitle>{poll.title}</CardTitle>
                  <CardDescription>
                    <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                      {poll.status}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    {poll.questions.length} question(s)
                  </p>
                </CardContent>
              </Card>
            ))}
            {activePolls.length === 0 && (
              <p className="text-gray-500">No active polls found.</p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="inactive">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {inactivePolls.map((poll) => (
              <Card
                key={poll._id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => router.push(`/poll/${poll._id}`)}
              >
                <CardHeader>
                  <CardTitle>{poll.title}</CardTitle>
                  <CardDescription>
                    <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                      {poll.status}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    {poll.questions.length} question(s)
                  </p>
                </CardContent>
              </Card>
            ))}
            {inactivePolls.length === 0 && (
              <p className="text-gray-500">No inactive polls found.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}
