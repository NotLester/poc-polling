"use client";

import { useMutation, useQuery } from 'convex/react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { useUser } from '@/hooks/useUser';

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

  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});

  if (!poll) {
    return <div>Loading...</div>;
  }

  const isExpired = poll.status === "inactive";
  const isPollCreator = user?.id === poll.userId;
  const isPollActive = poll.status === "published";

  // Calculate total votes for each question
  const getQuestionTotalVotes = (questionId: Id<"pollQuestions">) => {
    const options =
      poll.questions.find(q => q._id === questionId)?.options || [];
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
        description:
          error instanceof Error ? error.message : "Failed to record vote",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (
    questionId: Id<"pollQuestions">,
    newStatus: string
  ) => {
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
        description:
          error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
      });
    }
  };

  // New function to handle poll status toggle
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
        description:
          error instanceof Error
            ? error.message
            : "Failed to update poll status",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">{poll.title}</CardTitle>
          {isPollCreator && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {isPollActive ? "Active" : "Inactive"}
              </span>
              <Switch
                checked={isPollActive}
                onCheckedChange={handlePollStatusToggle}
                aria-label="Toggle poll status"
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {poll.questions.map(question => {
          const totalVotes = getQuestionTotalVotes(question._id);
          const isPublished = question.status === "published";
          return (
            <div key={question._id} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-lg">{question.text}</h3>
                {isPollCreator && !isExpired && (
                  <div className="flex items-center gap-2">
                    <Badge variant={isPublished ? "default" : "secondary"}>
                      {question.status}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleStatusChange(
                          question._id,
                          isPublished ? "unpublished" : "published"
                        )
                      }
                    >
                      {isPublished ? "Unpublish" : "Publish"}
                    </Button>
                  </div>
                )}
                {!isPollCreator && !isPublished && (
                  <Badge variant="secondary">Not yet available</Badge>
                )}
              </div>
              {(isPublished || isPollCreator) && (
                <div className="space-y-3">
                  {question.options.map(option => {
                    const percentage = getVotePercentage(
                      option.votes || 0,
                      totalVotes
                    );
                    return (
                      <div key={option._id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name={`question-${question._id}`}
                              value={option._id}
                              checked={
                                selectedOptions[question._id] === option._id
                              }
                              onChange={e =>
                                setSelectedOptions(prev => ({
                                  ...prev,
                                  [question._id]: e.target.value,
                                }))
                              }
                              disabled={isExpired || !isPublished}
                              className="radio"
                            />
                            <span>{option.text}</span>
                          </label>
                          <span className="text-sm text-muted-foreground">
                            {option.votes || 0} votes ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              )}
              {!isExpired && isPublished && (
                <Button
                  onClick={() => handleVote(question._id)}
                  disabled={!selectedOptions[question._id]}
                  className="mt-2"
                >
                  Vote
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
