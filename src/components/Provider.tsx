"use client";

import { ConvexReactClient } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { Toaster } from 'react-hot-toast';

import { ClerkProvider, useAuth } from '@clerk/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProviderWithClerk
      client={convex}
      useAuth={() => {
        const { getToken, isSignedIn, isLoaded, orgId, orgRole } = useAuth();
        return {
          getToken: async (opts?: { template?: "convex" }) => {
            const token = await getToken(opts);
            return token;
          },
          isSignedIn,
          isLoaded,
          orgId,
          orgRole,
        };
      }}
    >
      {children}
    </ConvexProviderWithClerk>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <ConvexClientProvider>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster position="top-center" />
        </QueryClientProvider>
      </ConvexClientProvider>
    </ClerkProvider>
  );
}
