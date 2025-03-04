import {BarChart3, PlusCircle} from "lucide-react";
import Link from "next/link";

import {useUser} from "@clerk/nextjs";

import {Button} from "../ui/button";

interface EmptyStateProps {
  type: string;
}

export const EmptyState = ({type}: EmptyStateProps) => {
  const {isSignedIn} = useUser();

  return (
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
        <Link href="/create">
          <Button variant="outline" className="gap-2">
            <PlusCircle size={16} />
            Create your first poll
          </Button>
        </Link>
      )}
    </div>
  );
};
