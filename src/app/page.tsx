"use client";

import { CheckCircle2, Clock, Loader2, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { EmptyState } from '@/components/poll/EmptyState';
import { PollCard } from '@/components/poll/PollCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGetPolls } from '@/hooks/poll';
import { Poll } from '@/types';
import { useUser } from '@clerk/nextjs';

export default function Home() {
  const {isLoaded, isSignedIn, user} = useUser();

  const {polls, pollsStatus} = useGetPolls();

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredActive, setFilteredActive] = useState<Poll[]>([]);
  const [filteredInactive, setFilteredInactive] = useState<Poll[]>([]);

  useEffect(() => {
    if (!polls) return;
    const active = polls.filter(poll => poll.status === "published");
    const inactive = polls.filter(poll => poll.status === "unpublished");

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      setFilteredActive(active.filter(poll => poll.title.toLowerCase().includes(term)));
      setFilteredInactive(inactive.filter(poll => poll.title.toLowerCase().includes(term)));
    } else {
      setFilteredActive(active);
      setFilteredInactive(inactive);
    }

    return () => {
      setFilteredActive([]);
      setFilteredInactive([]);
    };
  }, [polls, searchTerm]);

  if (!isLoaded || pollsStatus === "pending") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading polls...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <div className="flex flex-col space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Polls</h1>
            <p className="text-muted-foreground mt-1">
              {isSignedIn
                ? `Welcome back${user?.firstName ? `, ${user.firstName}` : ""}. Manage your polls and see responses.`
                : "Create and manage interactive polls."}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {isSignedIn && (
              <Link href="/create">
                <Button size="default" className="gap-2 shadow-sm">
                  <PlusCircle size={18} />
                  New Poll
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Search Section */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search polls..."
            className="w-full px-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex mb-6">
            <TabsTrigger value="active" className="flex-1">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Active Polls
              {filteredActive.length > 0 && (
                <Badge className="ml-2 bg-primary/10 text-primary hover:bg-primary/20 border-0">
                  {filteredActive.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="inactive" className="flex-1">
              <Clock className="h-4 w-4 mr-2" />
              Inactive Polls
              {filteredInactive.length > 0 && (
                <Badge className="ml-2 bg-primary/10 text-primary hover:bg-primary/20 border-0">
                  {filteredInactive.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {filteredActive.length === 0 ? (
              <EmptyState type="active" isSignedIn={isSignedIn} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredActive.map(poll => (
                  <PollCard key={poll._id} poll={poll} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="inactive" className="space-y-4">
            {filteredInactive.length === 0 ? (
              <EmptyState type="inactive" isSignedIn={isSignedIn} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredInactive.map(poll => (
                  <PollCard key={poll._id} poll={poll} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
