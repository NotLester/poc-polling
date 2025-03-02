"use client";

import { useMutation, useQuery } from 'convex/react';
import {
    BarChart3, CheckCircle2, Eye, EyeOff, LucideCheck, Settings, Share2, UserCheck, Vote
} from 'lucide-react';
import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';

import {
    AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/components/ui/use-toast';
import { useUser } from '@/hooks/useUser';
import { cn } from '@/lib/utils';

import { api } from '../../../convex/_generated/api';

import type {Id} from "../../../convex/_generated/dataModel";

interface PollProps {
  pollId: Id<"polls">;
}

export function Poll({pollId}: PollProps) {
  const {isSignedIn, user} = useUser();

  const poll = useQuery(api.polls.getPollDetails, {pollId});

  const vote = useMutation(api.polls.vote);
  const updatePollStatus = useMutation(api.polls.updatePollStatus);
  const updateStatus = useMutation(api.polls.updateQuestionStatus);

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [pageUrl, setPageUrl] = useState("");
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("vote");
  const [isHovering, setIsHovering] = useState<Record<string, boolean>>({});

  // Set the page URL for QR code once the component mounts on client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      setPageUrl(window.location.href);
    }
  }, []);

  if (!poll) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[1, 2].map(i => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-6 w-2/3" />
                <div className="space-y-3">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const isExpired = poll.status === "inactive";
  const isPollCreator = user?.id === poll.userId;
  const isPollActive = poll.status === "published";
  const hasVotableQuestions = poll.questions.some(q => q.status === "published");

  // Calculate total votes for each question
  const getQuestionTotalVotes = (questionId: Id<"pollQuestions">) => {
    const options = poll.questions.find(q => q._id === questionId)?.options || [];
    return options.reduce((sum, option) => sum + (option.votes || 0), 0);
  };

  // Calculate vote percentage for an option
  const getVotePercentage = (votes: number, totalVotes: number) => {
    if (totalVotes === 0) return 0;
    return (votes / totalVotes) * 100;
  };

  const handleVote = async (questionId: Id<"pollQuestions">) => {
    if (!isSignedIn) {
      toast({
        title: "Authentication required",
        description: "Please sign in to vote",
        variant: "destructive",
      });
      return;
    }

    const optionId = selectedOptions[questionId];
    if (!optionId) return;

    try {
      await vote({
        pollId,
        questionId,
        optionId: optionId as Id<"pollOptions">,
      });
      toast({
        title: "Vote recorded",
        description: "Your vote has been successfully recorded.",
      });
      // Clear the selection for this question
      setSelectedOptions(prev => {
        const next = {...prev};
        delete next[questionId];
        return next;
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to record vote",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (questionId: Id<"pollQuestions">, newStatus: string) => {
    try {
      await updateStatus({
        questionId,
        status: newStatus,
      });
      toast({
        title: "Status updated",
        description: `Question is now ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
      });
    }
  };

  // Handle poll status toggle
  const handlePollStatusToggle = async (checked: boolean) => {
    try {
      await updatePollStatus({
        pollId,
        status: checked ? "published" : "inactive",
      });
      toast({
        title: "Poll status updated",
        description: `Poll is now ${checked ? "published" : "inactive"}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update poll status",
        variant: "destructive",
      });
    }
  };

  // Calculate total votes across all questions
  const totalPollVotes = poll.questions.reduce(
    (sum, question) => sum + getQuestionTotalVotes(question._id),
    0
  );

  // Find highest voted option for each question
  const getHighestVotedOption = (questionId: Id<"pollQuestions">) => {
    const question = poll.questions.find(q => q._id === questionId);
    if (!question) return null;

    const options = [...question.options];
    options.sort((a, b) => (b.votes || 0) - (a.votes || 0));
    return options[0];
  };

  // Determine if user has voted on all questions
  const hasVotedOnAll = poll.questions.every(q => !selectedOptions[q._id]);

  // Get color by percentage
  const getColorByPercentage = (percentage: number) => {
    if (percentage >= 70) return "bg-green-500";
    if (percentage >= 40) return "bg-blue-500";
    if (percentage >= 20) return "bg-yellow-500";
    return "bg-gray-500";
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg border-t-4 border-t-primary bg-white">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">{poll.title}</CardTitle>
            <CardDescription className="mt-1">
              {isPollActive ? (
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-800 hover:bg-green-200"
                  >
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Active
                    </div>
                  </Badge>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <UserCheck size={14} />
                    {totalPollVotes} {totalPollVotes === 1 ? "vote" : "votes"}
                  </span>
                </div>
              ) : (
                <Badge
                  variant="destructive"
                  className="bg-red-100 text-red-800 hover:bg-red-200 mt-1"
                >
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    Inactive
                  </div>
                </Badge>
              )}
            </CardDescription>
          </div>
          {isPollCreator && (
            <div className="flex items-center space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center space-x-2 bg-slate-100 p-2 rounded-md">
                      <span className="text-sm font-medium">
                        {isPollActive ? "Active" : "Inactive"}
                      </span>
                      <Switch
                        checked={isPollActive}
                        onCheckedChange={handlePollStatusToggle}
                        aria-label="Toggle poll status"
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isPollActive ? "Deactivate poll" : "Activate poll"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {isPollActive && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQrDialogOpen(true)}
                        className="flex items-center gap-1"
                      >
                        <Share2 size={16} />
                        <span className="hidden sm:inline">Share</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Share poll with QR code</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {isPollCreator && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="vote" className="flex items-center gap-1">
                <Vote size={16} />
                <span>Voting View</span>
              </TabsTrigger>
              <TabsTrigger value="manage" className="flex items-center gap-1">
                <Settings size={16} />
                <span>Management</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {!isPollActive && !isPollCreator ? (
          <div className="p-8 text-center space-y-2 bg-slate-50 rounded-lg border border-dashed">
            <EyeOff className="mx-auto text-slate-400 mb-2" />
            <h3 className="font-semibold text-lg">This poll is currently inactive</h3>
            <p className="text-muted-foreground">
              The poll creator has temporarily disabled this poll.
            </p>
          </div>
        ) : !hasVotableQuestions && !isPollCreator ? (
          <div className="p-8 text-center space-y-2 bg-slate-50 rounded-lg border border-dashed">
            <Eye className="mx-auto text-slate-400 mb-2" />
            <h3 className="font-semibold text-lg">No questions available yet</h3>
            <p className="text-muted-foreground">
              Check back later when questions have been published.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {poll.questions.map(question => {
              const totalVotes = getQuestionTotalVotes(question._id);
              const isPublished = question.status === "published";
              const hasSelectedOption = !!selectedOptions[question._id];
              const highestVotedOption = getHighestVotedOption(question._id);

              if (!isPublished && !isPollCreator) return null;

              return (
                <div
                  key={question._id}
                  className={`space-y-4 p-4 rounded-lg transition-all ${
                    (isPollCreator && activeTab === "manage") || isPublished
                      ? "bg-white border shadow-sm hover:shadow-md"
                      : "bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-lg flex items-center gap-2">
                      {question.text}
                      {totalVotes > 0 && (
                        <Badge variant="outline" className="text-xs font-normal">
                          {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
                        </Badge>
                      )}
                    </h3>
                    {isPollCreator && activeTab === "manage" && !isExpired && (
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={isPublished ? "default" : "secondary"}
                          className={
                            isPublished
                              ? "bg-green-100 text-green-800 flex items-center gap-1"
                              : "flex items-center gap-1"
                          }
                        >
                          {isPublished ? (
                            <>
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              Published
                            </>
                          ) : (
                            <>
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              Draft
                            </>
                          )}
                        </Badge>
                        <Button
                          variant={isPublished ? "outline" : "default"}
                          size="sm"
                          onClick={() =>
                            handleStatusChange(
                              question._id,
                              isPublished ? "unpublished" : "published"
                            )
                          }
                          className="transition-all"
                        >
                          {isPublished ? (
                            <div className="flex items-center gap-1">
                              <EyeOff size={14} />
                              Hide
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Eye size={14} />
                              Publish
                            </div>
                          )}
                        </Button>
                      </div>
                    )}
                    {!isPollCreator && !isPublished && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <EyeOff size={12} />
                        Not available
                      </Badge>
                    )}
                  </div>
                  {(isPublished || (isPollCreator && activeTab === "manage")) && (
                    <div className="space-y-3 mt-2">
                      {question.options.map(option => {
                        const percentage = getVotePercentage(option.votes || 0, totalVotes);
                        const isHighest = highestVotedOption?._id === option._id && totalVotes > 0;

                        return (
                          <div
                            key={option._id}
                            className={cn(
                              "space-y-2 transition-all rounded-lg p-2",
                              isHovering[option._id] ? "bg-slate-50" : "",
                              isHighest && totalVotes > 0
                                ? "border-l-4 border-l-green-500 pl-3"
                                : ""
                            )}
                            onMouseEnter={() =>
                              setIsHovering(prev => ({
                                ...prev,
                                [option._id]: true,
                              }))
                            }
                            onMouseLeave={() =>
                              setIsHovering(prev => ({
                                ...prev,
                                [option._id]: false,
                              }))
                            }
                          >
                            <div className="flex items-center justify-between">
                              <label className="flex items-center space-x-3 cursor-pointer w-full rounded-md">
                                <div className="relative">
                                  <input
                                    type="radio"
                                    name={`question-${question._id}`}
                                    value={option._id}
                                    checked={selectedOptions[question._id] === option._id}
                                    onChange={e =>
                                      setSelectedOptions(prev => ({
                                        ...prev,
                                        [question._id]: e.target.value,
                                      }))
                                    }
                                    disabled={
                                      isExpired ||
                                      !isPublished ||
                                      (isPollCreator && activeTab === "manage")
                                    }
                                    className="radio text-primary w-4 h-4 accent-primary"
                                  />
                                </div>
                                <div className="flex-grow relative">
                                  <span
                                    className={cn("transition-all", isHighest && "font-medium")}
                                  >
                                    {option.text}
                                  </span>
                                  {isHighest && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-200">
                                            <LucideCheck size={12} className="mr-1" />
                                            Leading
                                          </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>Most voted option</TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>
                              </label>
                              <span className="text-sm text-muted-foreground whitespace-nowrap">
                                {option.votes || 0} {option.votes === 1 ? "vote" : "votes"} (
                                {percentage.toFixed(1)}%)
                              </span>
                            </div>
                            <div className="relative h-2">
                              <Progress
                                value={percentage}
                                className={cn(
                                  "h-2 rounded-full transition-all",
                                  getColorByPercentage(percentage),
                                  percentage === 0 ? "bg-slate-200" : ""
                                )}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {!isExpired && isPublished && (isPollCreator ? activeTab !== "manage" : true) && (
                    <Button
                      onClick={() => handleVote(question._id)}
                      disabled={!selectedOptions[question._id]}
                      className={cn(
                        "mt-3 w-full sm:w-auto transition-all",
                        hasSelectedOption
                          ? "bg-primary hover:bg-primary/90"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      )}
                      variant={hasSelectedOption ? "default" : "outline"}
                    >
                      <Vote className="mr-2 h-4 w-4" />
                      Submit Vote
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {isPollActive && isPollCreator && activeTab === "manage" && poll.questions.length > 0 && (
          <div className="mt-8 bg-slate-50 p-4 rounded-lg border border-dashed">
            <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
              <BarChart3 size={16} />
              <h3 className="font-medium">Poll Insights</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="text-sm text-slate-500">Total Votes</div>
                <div className="text-xl font-bold">{totalPollVotes}</div>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="text-sm text-slate-500">Questions</div>
                <div className="text-xl font-bold">{poll.questions.length}</div>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="text-sm text-slate-500">Published</div>
                <div className="text-xl font-bold">
                  {poll.questions.filter(q => q.status === "published").length}
                </div>
              </div>
            </div>
          </div>
        )}

        {isPollActive && !isPollCreator && hasVotedOnAll && totalPollVotes > 0 && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-100 text-center flex items-center justify-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <p className="text-green-700 font-medium">Thank you for participating in this poll!</p>
          </div>
        )}
      </CardContent>

      <AlertDialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Share Your Poll</AlertDialogTitle>
            <AlertDialogDescription>
              Use this QR code or link to share your poll with others.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-center my-4">
            <div className="p-6 bg-white rounded-lg shadow-sm flex flex-col items-center justify-center gap-6 border">
              <div className="bg-white p-3 rounded-lg shadow border">
                <QRCode value={pageUrl} size={220} level="H" className="max-w-full" />
              </div>
              <div className="w-full">
                <p className="text-xs text-muted-foreground mb-1">Poll URL:</p>
                <div className="flex items-center gap-2">
                  <div className="bg-slate-50 p-2 rounded-md text-sm overflow-hidden text-ellipsis w-full border">
                    {pageUrl}
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(pageUrl);
                            toast({
                              title: "URL Copied",
                              description: "Poll URL has been copied to clipboard",
                            });
                          }}
                        >
                          Copy
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy to clipboard</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
