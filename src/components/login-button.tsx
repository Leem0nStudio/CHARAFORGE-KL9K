
'use client';
import { LogIn, LogOut, User as UserIcon, Users, Settings, BarChart } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/hooks/use-auth';
import { getFirebaseClient } from '@/lib/firebase/client';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import Link from 'next/link';

export function LoginButton() {
  const { userProfile, loading } = useAuth();

  const handleSignOut = async () => {
    try {
      const { auth } = getFirebaseClient();
      await signOut(auth);
    } catch (error: unknown) {
      console.error("Error signing out: ", error);
    }
  };

  if (loading) {
    return <Button variant="ghost" size="icon" className="w-24 h-9" disabled><UserIcon /></Button>;
  }

  if (userProfile) {
    const isAdmin = userProfile.role === 'admin';
    const fallbackInitial = userProfile.displayName
      ? userProfile.displayName.charAt(0).toUpperCase()
      : userProfile.email?.charAt(0).toUpperCase() || '?';

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={userProfile.photoURL ?? undefined}
                alt={userProfile.displayName ?? 'User avatar'}
                data-ai-hint="user avatar"
              />
              <AvatarFallback>
                {fallbackInitial}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {userProfile.displayName || 'User'}
              </p>
               <p className="text-xs leading-none text-muted-foreground">
                   {userProfile.email}
               </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
           {isAdmin && (
             <DropdownMenuItem asChild>
                <Link href="/admin">
                  <BarChart className="mr-2 h-4 w-4" />
                  <span>Admin Dashboard</span>
                </Link>
              </DropdownMenuItem>
            )}
          <DropdownMenuItem asChild>
            <Link href="/characters">
              <Users className="mr-2 h-4 w-4" />
              <span>My Characters</span>
            </Link>
          </DropdownMenuItem>
           <DropdownMenuItem asChild>
            <Link href="/profile">
              <Settings className="mr-2 h-4 w-4" />
              <span>Profile Settings</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button asChild>
      <Link href="/login">
        <LogIn className="mr-2 h-4 w-4" /> Login
      </Link>
    </Button>
  );
}
