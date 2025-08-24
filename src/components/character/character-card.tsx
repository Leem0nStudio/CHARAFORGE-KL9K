
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { User, GitBranch, Layers, Package, Tag, Pilcrow, Image as ImageIcon, Heart } from 'lucide-react';
import { Card, CardFooter, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { Character } from '@/types/character';
import { getSlotCategory } from '@/lib/app-config';
import { cn } from '@/lib/utils';
import { GachaCard } from './gacha-card';

interface CharacterCardProps {
    character: Character;
}

export function CharacterCard({ character }: CharacterCardProps) {
    const isBranch = !!character.lineage.branchedFromId;
    const hasVersions = character.lineage.versions && character.lineage.versions.length > 1;

    return (
        <motion.div
            key={character.id}
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
            }}
            className="h-full group"
        >
            <div className="relative">
                <GachaCard character={character} />
                <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                     <Badge variant="secondary" className="flex items-center gap-1.5 bg-background/80 backdrop-blur-sm">
                        <Heart className="text-destructive fill-destructive"/> {character.meta.likes || 0}
                    </Badge>
                </div>
            </div>
        </motion.div>
    );
}
