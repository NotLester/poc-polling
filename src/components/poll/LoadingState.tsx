import { Loader2 } from 'lucide-react';

export const LoadingState = () => (
  <div className="flex flex-col items-center justify-center min-h-screen">
    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
    <p className="text-lg text-muted-foreground">Loading polls...</p>
  </div>
);
