
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { followUser, unfollowUser } from '@/app/actions/user';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FollowButtonProps {
    currentUserId: string | null;
    profileUserId: string;
    isFollowingInitially: boolean;
}

export function FollowButton({ currentUserId, profileUserId, isFollowingInitially }: FollowButtonProps) {
    const [isFollowing, setIsFollowing] = useState(isFollowingInitially);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const { toast } = useToast();

    if (!currentUserId || currentUserId === profileUserId) {
        return null;
    }

    const handleFollow = () => {
        startTransition(async () => {
            setIsFollowing(true);
            const result = await followUser(profileUserId);
            if (!result.success) {
                setIsFollowing(false);
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            } else {
                router.refresh(); // Refresh to update counts
            }
        });
    };

    const handleUnfollow = () => {
        startTransition(async () => {
            setIsFollowing(false);
            const result = await unfollowUser(profileUserId);
            if (!result.success) {
                setIsFollowing(true);
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            } else {
                 router.refresh(); // Refresh to update counts
            }
        });
    };

    return (
        <Button 
            className="w-full flex-1" 
            variant={isFollowing ? 'secondary' : 'default'}
            onClick={isFollowing ? handleUnfollow : handleFollow}
            disabled={isPending}
        >
            {isPending ? (
                <Loader2 className="mr-2 animate-spin" />
            ) : isFollowing ? (
                <UserCheck className="mr-2" />
            ) : (
                <UserPlus className="mr-2" />
            )}
            {isFollowing ? 'Following' : 'Follow'}
        </Button>
    );
}
