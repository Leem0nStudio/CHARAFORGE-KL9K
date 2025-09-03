
'use client';
import { LogIn, LogOut, User as UserIcon, Settings, BarChart } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
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
import { useRouter } from 'next/navigation';

export function LoginButton() {
  const { userProfile, loading } = useAuth();
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh(); // Force a refresh to update server components
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
                  <span>Admin Panel</span>
                </Link>
              </DropdownMenuItem>
            )}
          <DropdownMenuItem asChild>
            <Link href="/characters">
              <UserIcon className="mr-2 h-4 w-4" />
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
