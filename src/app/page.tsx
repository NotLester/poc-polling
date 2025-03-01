"use client";

import { useQuery } from 'convex/react';
import { BarChart3, Calendar, CheckCircle2, Clock, Loader2, PlusCircle, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
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
  const {isLoaded, isSignedIn, user} = useUser();
  const polls = useQuery(api.queries.getPolls);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredActive, setFilteredActive] = useState<any[]>([]);
  const [filteredInactive, setFilteredInactive] = useState<any[]>([]);

  useEffect(() => {
    // Simulate loading for smoother transitions
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (polls) {
      const active = polls.filter(poll => poll.status === "published");
      const inactive = polls.filter(poll => poll.status === "unpublished");
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        setFilteredActive(
          active.filter(poll => poll.title.toLowerCase().includes(term))
        );
        setFilteredInactive(
          inactive.filter(poll => poll.title.toLowerCase().includes(term))
        );
      } else {
        setFilteredActive(active);
        setFilteredInactive(inactive);
      }
    }
  }, [polls, searchTerm]);

  const getTotalVotes = (poll: Poll) => {
    return poll.questions.reduce((total, question) => {
      return (
        total + question.options.reduce((sum, option) => sum + option.votes, 0)
      );
    }, 0);
  };

  if (!isLoaded || !polls || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading polls...</p>
      </div>
    );
  }

  const handleCreatePoll = () => {
    router.push("/create");
  };

  const handleViewPoll = (pollId: Id<"polls">) => {
    router.push(`/poll/${pollId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-50 text-green-600 border-green-200";
      case "unpublished":
        return "bg-amber-50 text-amber-600 border-amber-200";
      case "inactive":
        return "bg-gray-50 text-gray-600 border-gray-200";
      default:
        return "bg-blue-50 text-blue-600 border-blue-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "published":
        return <CheckCircle2 className="h-4 w-4 mr-1" />;
      case "unpublished":
        return <Clock className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };

  const EmptyState = ({type}: {type: string}) => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-muted/30 p-4 rounded-full mb-4">
        <BarChart3 className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">No {type} polls found</h3>
      <p className="text-muted-foreground max-w-md mb-6">
        {type === "active"
          ? "You don't have any active polls yet. Create a new poll to start gathering responses."
          : "You don't have any inactive polls. Unpublished polls will appear here."}
      </p>
      {isSignedIn && type === "active" && (
        <Button onClick={handleCreatePoll} variant="outline" className="gap-2">
          <PlusCircle size={16} />
          Create your first poll
        </Button>
      )}
    </div>
  );

  const PollCard = ({poll}: {poll: Poll}) => {
    const totalVotes = getTotalVotes(poll);
    const totalOptions = poll.questions.reduce(
      (sum, q) => sum + q.options.length,
      0
    );
    const createdDate = new Date().toLocaleDateString(); // Placeholder - would come from API

    return (
      <Card
        className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/20 overflow-hidden group"
        onClick={() => handleViewPoll(poll._id)}
      >
        <div className="h-2 bg-primary/80 w-full group-hover:bg-primary transition-colors"></div>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-xl group-hover:text-primary transition-colors">
              {poll.title}
            </CardTitle>
            <Badge
              className={cn("flex items-center", getStatusColor(poll.status))}
            >
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
    );
  };

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
              <Button
                onClick={handleCreatePoll}
                size="default"
                className="gap-2 shadow-sm"
              >
                <PlusCircle size={18} />
                New Poll
              </Button>
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
              <EmptyState type="active" />
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
              <EmptyState type="inactive" />
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
