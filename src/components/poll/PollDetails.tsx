"use client";

import dynamic from 'next/dynamic';

import { Badge } from '@/components/ui/badge';
import { useUser } from '@/hooks/useUser';
import { isPollActive } from '@/lib/utils';
import { IPoll } from '@/types';

// Dynamically import the QRCode component to ensure it only loads on the client side
const QRCode = dynamic(() => import("./QRCode"), {ssr: false});

type Props = {
  poll: IPoll;
};

const PollDetails = ({poll}: Props) => {
  const {data: user, isLoading, error} = useUser();

  return (
    <div className="space-y-4 w-full">
      <div className="flex justify-between items-start">
        <h1 className="text-3xl font-bold break-words">{poll?.title}</h1>
        <div className="hidden sm:block">
          <QRCode pollId={poll.id} />
        </div>
      </div>

      <p className="text-muted-foreground">{poll?.description}</p>

      <div className="flex justify-between flex-col md:flex-row lg:flex-row xl:flex-row 2xl:flex-row">
        <h4 className="text-lg">
          <span className="text-muted-foreground">Asked by: </span>
          {user?.user_metadata?.name}{" "}
          <span className="text-muted-foreground">on </span>
          {new Date(poll.created_at).toLocaleString(undefined, {
            weekday: "short",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </h4>
        <div className="flex items-center space-x-3">
          <h4 className="text-lg">
            {isPollActive(poll?.end_date) ? (
              <>
                <span className="text-muted-foreground">Active till: </span>
                {new Date(poll?.end_date).toLocaleString()}{" "}
              </>
            ) : (
              <Badge variant="destructive"> Poll Expired</Badge>
            )}
          </h4>
          <div className="block sm:hidden">
            <QRCode pollId={poll.id} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PollDetails;
