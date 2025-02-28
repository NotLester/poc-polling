"use client";

import { notFound, useParams } from 'next/navigation';

import { Poll } from '@/components/poll/Poll';

import type { Id } from "../../../../convex/_generated/dataModel";

export default function PollPage() {
  const params = useParams();
  const pollId = params.pollId as unknown as Id<"polls">;

  if (!pollId) {
    notFound();
  }

  return (
    <main className="container mx-auto py-10">
      <Poll pollId={pollId} />
    </main>
  );
}
