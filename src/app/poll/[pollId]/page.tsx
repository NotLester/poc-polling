import {notFound} from "next/navigation";

import Poll from "@/components/poll/Poll";

import type {Id} from "../../../../convex/_generated/dataModel";

interface PollPageProps {
  params: {
    pollId: Id<"polls">;
  };
}

export default function PollPage({params: {pollId}}: PollPageProps) {
  if (!pollId) throw notFound();

  return (
    <main className="container mx-auto py-10">
      <Poll pollId={pollId} />
    </main>
  );
}
