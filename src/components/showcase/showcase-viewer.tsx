
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { Character } from '@/types/character';
import { ArrowLeft, Edit, Share2, Dna, Swords as SwordsIcon, Shield, BrainCircuit, BarChart3, Info, User, Heart } from 'lucide-react';
import { StatItem } from './stat-item';
import { StarRating } from './star-rating';
import { motion } from 'framer-motion';
import { LikeButton } from '../likes/like-button';
import { FollowButton } from '../user/follow-button';
import { getFollowStatus } from '@/app/actions/user';
import { useEffect, useState } from 'react';
import { CommentSection } from '@/components/comments/comment-section';
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
