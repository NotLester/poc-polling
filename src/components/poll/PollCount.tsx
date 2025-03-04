import { Badge } from '../ui/badge';

interface PollCountProps {
  count: number;
}

export function PollCount({count}: PollCountProps) {
  return (
    <>
      {count > 0 && (
        <Badge className="ml-2 bg-primary/10 text-primary hover:bg-primary/20 border-0">
          {count}
        </Badge>
      )}
    </>
  );
}
