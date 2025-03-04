"use client";

import { useQuery } from 'convex/react';
import { CheckCircle2, Clock, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { LoadingState } from '@/components/poll/LoadingState';
import { PollCount } from '@/components/poll/PollCount';
import { PollsList } from '@/components/poll/PollsList';
import { SearchBar } from '@/components/poll/SearchBar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useDebounce from '@/hooks/use-debounce';
import { useUser } from '@clerk/nextjs';

import { api } from '../../convex/_generated/api';

export default function Home() {
  const {isLoaded, isSignedIn, user} = useUser();

  const polls = useQuery(api.queries.getPolls);

  const [searchInput, setSearchInput] = useState("");

  const searchTerm = useDebounce(searchInput, 300);

  // Memoized derived data
  const filteredActive = useMemo(() => {
    if (!polls) return [];
    const term = searchTerm.toLowerCase();
    return polls.filter(
      poll =>
        poll.status === "published" && (!searchTerm || poll.title.toLowerCase().includes(term))
    );
  }, [polls, searchTerm]);

  const filteredInactive = useMemo(() => {
    if (!polls) return [];
    const term = searchTerm.toLowerCase();
    return polls.filter(
      poll =>
        poll.status === "unpublished" && (!searchTerm || poll.title.toLowerCase().includes(term))
    );
  }, [polls, searchTerm]);

  const activeCount = useMemo(() => filteredActive.length, [filteredActive]);
  const inactiveCount = useMemo(() => filteredInactive.length, [filteredInactive]);

  const greeting = useMemo<string>(() => {
    if (!isSignedIn) return "Create and manage interactive polls.";
    return `Welcome back${user?.firstName ? `, ${user.firstName}` : ""}. Manage your polls and see responses.`;
  }, [isSignedIn, user?.firstName]);

  if (!isLoaded || !polls) {
    return <LoadingState />;
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <div className="flex flex-col space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Polls</h1>
            <p className="text-muted-foreground mt-1">{greeting}</p>
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
        <SearchBar value={searchInput} onChange={setSearchInput} />

        {/* Tabs */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex mb-6">
            <TabsTrigger value="active" className="flex-1">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Active Polls
              <PollCount count={activeCount} />
            </TabsTrigger>
            <TabsTrigger value="inactive" className="flex-1">
              <Clock className="h-4 w-4 mr-2" />
              Inactive Polls
              <PollCount count={inactiveCount} />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            <PollsList polls={filteredActive} emptyStateType="active" />
          </TabsContent>

          <TabsContent value="inactive" className="space-y-4">
            <PollsList polls={filteredInactive} emptyStateType="inactive" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
