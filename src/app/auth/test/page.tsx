"use client";

import { useUser } from '@clerk/nextjs';

export default function TestAuth() {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Auth Test Page</h1>

      <div className="space-y-4">
        <div>
          <strong>Auth Status:</strong>{" "}
          {isSignedIn ? "Signed In" : "Signed Out"}
        </div>

        {isSignedIn && (
          <div className="space-y-2">
            <div>
              <strong>User ID:</strong> {user.id}
            </div>
            <div>
              <strong>Email:</strong> {user.primaryEmailAddress?.emailAddress}
            </div>
            <div>
              <strong>Name:</strong> {user.fullName}
            </div>
            <div>
              <img
                src={user.imageUrl}
                alt="Profile"
                className="w-16 h-16 rounded-full"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
