'use client';
import { LogIn, LogOut, User as UserIcon, Users, Settings, BarChart } from 'lucide-react';
import { signOut, type Auth } from 'firebase/auth';
import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase/client';
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
  const { user, loading } = useAuth();

  const handleSignOut = async () => {
    try {
      // Ensure auth object is fully initialized before using.
      if (auth && (auth as Auth).signOut) {
        await signOut(auth);
      }
    } catch (error: unknown) {
      // Avoid logging errors to the console in production.
      if (process.env.NODE_ENV !== 'production') {
          console.error('Error signing out:', error);
      }
    }
  };

  if (loading) {
    // Show a placeholder button while auth state is loading.
    return <Button variant="ghost" size="icon" className="w-24 h-9" disabled><UserIcon /></Button>;
  }

  if (user) {
    const isAdmin = user.role === 'admin';
    const fallbackInitial = user.displayName
      ? user.displayName.charAt(0).toUpperCase()
      : user.email?.charAt(0).toUpperCase() || '?';

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={user.photoURL ?? undefined}
                alt={user.displayName ?? 'User avatar'}
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
                {user.displayName || 'User'}
              </p>
               <p className="text-xs leading-none text-muted-foreground">
                   {user.email}
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
