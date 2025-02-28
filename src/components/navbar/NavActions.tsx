"use client";

import LoginButton from '@/app/auth/compoenents/LoginButton';
import { useAuth } from '@clerk/nextjs';

import UserDropdown from './UserDropdown';

export default function NavActions() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <LoginButton />;
  }

  return <UserDropdown />;
}
