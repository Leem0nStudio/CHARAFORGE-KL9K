
'use client';

import { useState, useTransition, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toggleLikeCharacter } from '@/app/actions/likes';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

interface LikeButtonProps {
  characterId: string;
  initialLikeCount: number;
  initialUserHasLiked: boolean;
}

export function LikeButton({ 
  characterId,
  initialLikeCount,
  initialUserHasLiked 
}: LikeButtonProps) {
  const { authUser } = useAuth();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [userHasLiked, setUserHasLiked] = useState(initialUserHasLiked);

  useEffect(() => {
    setLikeCount(initialLikeCount);
    setUserHasLiked(initialUserHasLiked);
  }, [initialLikeCount, initialUserHasLiked]);

  const handleLike = () => {
    if (!authUser) {
      toast({ variant: 'destructive', title: 'Please log in to like characters.' });
      return;
    }

    startTransition(async () => {
      // Optimistic update
      setUserHasLiked(prev => !prev);
      setLikeCount(prev => userHasLiked ? prev - 1 : prev + 1);

      const result = await toggleLikeCharacter(characterId);

      if (!result.success) {
        // Revert on error
        setUserHasLiked(prev => !prev);
        setLikeCount(prev => userHasLiked ? prev + 1 : prev - 1);
        toast({ variant: 'destructive', title: 'Error', description: result.error });
      } else {
        // Sync with server state just in case
        setLikeCount(result.newLikeCount ?? likeCount);
        setUserHasLiked(result.liked ?? userHasLiked);
      }
    });
  };

  return (
    <Button 
      onClick={handleLike} 
      variant="outline" 
      size="sm"
      className="flex items-center gap-2"
      disabled={isPending || !authUser}
    >
      <Heart className={cn(
        "h-4 w-4 transition-all", 
        userHasLiked ? 'fill-red-500 text-red-500' : 'text-gray-500'
      )} />
      <span className="font-semibold">{likeCount}</span>
    </Button>
  );
}
