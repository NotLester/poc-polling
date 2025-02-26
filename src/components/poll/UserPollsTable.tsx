"use client";

import { Plus, Rocket } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { isPollActive } from '@/lib/utils';
import { Tables } from '@/types/supabase';

import PollAction from './PollAction';

type Props = {
  userPolls: Array<Tables<"poll">> | null;
};

const UserPollsTable = ({userPolls}: Props) => {
  return (
    <Card x-chunk="dashboard-06-chunk-0" className="bg-muted/40">
      <CardHeader>
        <h1 className="text-3xl font-bold flex items-center gap-2 ">
          Your Polls <Rocket className="text-orange-500" />
        </h1>
        <CardDescription>
          Manage your polls and view their status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>End At</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {userPolls?.map(poll => (
              <TableRow key={poll.id}>
                <TableCell className="font-medium">
                  <Link href={"/poll/" + poll.id} className="underline">
                    {poll.title.length > 50
                      ? poll.title.slice(0, 50) + " ..."
                      : poll.title}
                  </Link>
                </TableCell>
                <TableCell className="font-medium">
                  {isPollActive(poll?.end_date) ? (
                    <Badge className=" bg-orange-500">Active</Badge>
                  ) : (
                    <Badge variant="destructive">Expired</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(poll.created_at).toDateString()}
                </TableCell>
                <TableCell>{new Date(poll.end_date).toDateString()}</TableCell>
                <TableCell>
                  <PollAction poll={poll} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {userPolls?.length === 0 && (
          <div className="text-center w-full pt-6 space-y-8">
            <h1 className="mb-5">
              You don't any polls. Click here to create 👇
            </h1>
            <Link href="/create-poll">
              <Button>
                <Plus className="h-4 w-4 mr-1" /> Create your poll
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserPollsTable;
