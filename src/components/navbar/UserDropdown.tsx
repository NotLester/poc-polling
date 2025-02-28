"use client";

import { LogOut, Palette, Plus, User as UserIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';

import { useClerk, useUser } from '@clerk/nextjs';

import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import {
    DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup,
    DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuSeparator, DropdownMenuSub,
    DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger
} from '../ui/dropdown-menu';

const UserDropdown = () => {
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { theme, setTheme } = useTheme();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.imageUrl} alt="profile-pic" />
            <AvatarFallback>
              {user.firstName?.slice(0, 1)}
              {user.lastName?.slice(0, 1)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.fullName || user.username}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push(`/profile`)}>
            <UserIcon className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => router.push("/create-poll")}>
            <Plus className="mr-2 h-4 w-4" />
            Create Poll
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Palette className="mr-2 h-4 w-4" />
            <span>Appearance</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuCheckboxItem
                checked={theme === "light"}
                onClick={() => setTheme("light")}
              >
                Light
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={theme === "dark"}
                onClick={() => setTheme("dark")}
              >
                Dark
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={theme === "system"}
                onClick={() => setTheme("system")}
              >
                System
              </DropdownMenuCheckboxItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => signOut()}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserDropdown;
