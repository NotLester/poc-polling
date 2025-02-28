"use client";

import { useMutation, useQuery } from 'convex/react';
import { formatDistanceToNow } from 'date-fns';
import { useParams } from 'next/navigation';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/components/ui/use-toast';
import { useUser } from '@/hooks/useUser';

import { api } from '../../../../convex/_generated/api';

import type { Id } from "../../../../convex/_generated/dataModel";

export default function PollPage() {
  const params = useParams();
  const pollId = params.id as unknown as Id<"polls">;
  const { isSignedIn, user } = useUser();
  const poll = useQuery(api.polls.getPollDetails, { pollId });
  const vote = useMutation(api.polls.vote);
  const updateStatus = useMutation(api.polls.updateQuestionStatus);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});

  if (!poll) {
    return <div className="container mx-auto py-10">Loading...</div>;
  }

  const isExpired = new Date(poll.endDate) <= new Date();
  const isPollCreator = user?.id === poll.userId;

  const handleVote = async (questionId: string) => {
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
        pollId: pollId as Id<"polls">,
        questionId: questionId as unknown as Id<"pollQuestions">,
        optionId: optionId as unknown as Id<"pollOptions">,
      });
      toast({
        title: "Vote recorded",
        description: "Your vote has been successfully recorded.",
      });
      // Clear the selection for this question
      setSelectedOptions((prev) => {
        const next = { ...prev };
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

  const handleStatusChange = async (questionId: string, newStatus: string) => {
    try {
      await updateStatus({
        questionId: questionId as unknown as Id<"pollQuestions">,
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

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>{poll.title}</CardTitle>
          <p className="text-sm text-gray-500">
            {isExpired
              ? `Ended ${formatDistanceToNow(new Date(poll.endDate))} ago`
              : `Ends ${formatDistanceToNow(new Date(poll.endDate))} from now`}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {poll.questions.map((question) => {
            const isPublished = question.status === "published";
            return (
              <div key={question._id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{question.text}</h3>
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
                            isPublished ? "inactive" : "published"
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
                  <RadioGroup
                    value={selectedOptions[question._id]}
                    onValueChange={(value) =>
                      setSelectedOptions((prev) => ({
                        ...prev,
                        [question._id]: value,
                      }))
                    }
                    className="space-y-2"
                  >
                    {question.options.map((option) => (
                      <div
                        key={option._id}
                        className="flex items-center space-x-2"
                      >
                        <RadioGroupItem
                          value={option._id}
                          id={option._id}
                          disabled={isExpired || !isPublished}
                        />
                        <Label htmlFor={option._id}>
                          {option.text} ({option.votes} votes)
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
                {!isExpired && isPublished && (
                  <Button
                    onClick={() => handleVote(question._id)}
                    disabled={!selectedOptions[question._id]}
                  >
                    Vote
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
