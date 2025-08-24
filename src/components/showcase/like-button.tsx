
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { likeCharacter, unlikeCharacter } from '@/app/actions/social';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface LikeButtonProps {
    characterId: string;
    initialLikes: number;
    isLikedInitially: boolean;
    currentUserId: string | null;
}

export function LikeButton({ characterId, initialLikes, isLikedInitially, currentUserId }: LikeButtonProps) {
    const [isLiked, setIsLiked] = useState(isLikedInitially);
    const [likeCount, setLikeCount] = useState(initialLikes);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const { toast } = useToast();

    const handleLike = async () => {
        if (!currentUserId) {
            router.push('/login');
            return;
        }

        startTransition(async () => {
            // Optimistic UI update
            setIsLiked(true);
            setLikeCount(prev => prev + 1);

            const result = await likeCharacter(characterId);
            if (!result.success) {
                // Revert optimistic update on failure
                setIsLiked(false);
                setLikeCount(prev => prev - 1);
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        });
    };

    const handleUnlike = async () => {
        if (!currentUserId) {
             router.push('/login');
            return;
        }
        
        startTransition(async () => {
            // Optimistic UI update
            setIsLiked(false);
            setLikeCount(prev => prev - 1);

            const result = await unlikeCharacter(characterId);
             if (!result.success) {
                // Revert optimistic update on failure
                setIsLiked(true);
                setLikeCount(prev => prev + 1);
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        });
    };

    return (
        <Button 
            variant="secondary" 
            className="flex-1"
            onClick={isLiked ? handleUnlike : handleLike}
            disabled={isPending || !currentUserId}
        >
            <Heart className={cn("mr-2", isLiked && "fill-destructive text-destructive")} />
            {likeCount}
        </Button>
    );
}
