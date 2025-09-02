
'use client';

import type { Character } from '@/types/character';
import type { Comment } from '@/app/actions/comments';
import { GenshinLikeShowcase } from './genshin-like-showcase';


interface ShowcaseViewerProps {
    character: Character;
    currentUserId: string | null;
    isLikedInitially: boolean;
    initialComments: Comment[];
}

export function ShowcaseViewer({ character, currentUserId, isLikedInitially, initialComments }: ShowcaseViewerProps) {
    return (
        <GenshinLikeShowcase 
            character={character}
            currentUserId={currentUserId}
            isLikedInitially={isLikedInitially}
            initialComments={initialComments}
        />
    )
}
