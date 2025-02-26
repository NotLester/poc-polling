import React from "react";
import { Metadata } from "next";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import CreatePollForm from "@/components/poll/CreatePoll";

export const metadata: Metadata = {
  title: "Create your Poll",
};

const CreatePollPage = () => {
  return (
    <div className="flex justify-center pb-2">
      <Card className="w-[600px]">
        <CardHeader>
          <CardTitle>Create a Poll</CardTitle>
          <CardDescription>Your Ideas, Your Poll!</CardDescription>
        </CardHeader>
        <CardContent>
          <CreatePollForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default CreatePollPage;
