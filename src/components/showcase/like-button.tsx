
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { likeCharacter, unlikeCharacter } from '@/app/actions/social';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

interface LikeButtonProps {
    characterId: string;
    initialLikes: number;
    isLikedInitially: boolean;
}

export function LikeButton({ characterId, initialLikes, isLikedInitially }: LikeButtonProps) {
    const { authUser } = useAuth();
    const [isLiked, setIsLiked] = useState(isLikedInitially);
    const [likeCount, setLikeCount] = useState(initialLikes);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const { toast } = useToast();

    const handleLike = async () => {
        if (!authUser) {
            router.push('/login');
            return;
        }

        startTransition(async () => {
            setIsLiked(true);
            setLikeCount(prev => prev + 1);
            const result = await likeCharacter(characterId);
            if (!result.success) {
                setIsLiked(false);
                setLikeCount(prev => prev - 1);
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        });
    };

    const handleUnlike = async () => {
        if (!authUser) {
             router.push('/login');
            return;
        }
        
        startTransition(async () => {
            setIsLiked(false);
            setLikeCount(prev => prev - 1);
            const result = await unlikeCharacter(characterId);
             if (!result.success) {
                setIsLiked(true);
                setLikeCount(prev => prev + 1);
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        });
    };

    return (
        <button 
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 bg-black/30 hover:bg-black/50"
            onClick={isLiked ? handleUnlike : handleLike}
            disabled={isPending || !authUser}
        >
            <Heart className={cn("h-[18px] w-[18px]", isLiked && "fill-destructive text-destructive")} />
            <span className="text-sm font-semibold">{likeCount} Like</span>
        </button>
    );
}
