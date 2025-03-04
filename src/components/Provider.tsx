"use client";

import {ConvexReactClient} from "convex/react";
import {ConvexProviderWithClerk} from "convex/react-clerk";
import {Toaster} from "react-hot-toast";

import {ClerkProvider, useAuth} from "@clerk/nextjs";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function ConvexClientProvider({children}: {children: React.ReactNode}) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}

export default function Providers({children}: {children: React.ReactNode}) {
  return (
    <ClerkProvider>
      <ConvexClientProvider>
        {children}
        <Toaster position="top-center" />
      </ConvexClientProvider>
    </ClerkProvider>
  );
}
