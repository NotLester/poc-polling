import { useUser as useClerkUser } from '@clerk/nextjs';

export function useUser() {
  const { user, isLoaded, isSignedIn } = useClerkUser();

  return {
    user,
    isLoaded,
    isSignedIn,
    // Commonly used user properties
    id: user?.id,
    email: user?.emailAddresses[0]?.emailAddress,
    name: user?.firstName
      ? `${user.firstName} ${user.lastName || ""}`
      : user?.emailAddresses[0]?.emailAddress,
    imageUrl: user?.imageUrl,
  };
}
