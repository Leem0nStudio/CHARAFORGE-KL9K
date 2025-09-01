// PLAN: This component will now be a simple wrapper around the new `GachaCard`.
// It will handle the overall animation variants for staggering items in a list.
// All visual logic will be delegated to `GachaCard`.
'use client';

import { motion } from 'framer-motion';
import type { Character } from '@/types/character';
import { GachaCard } from './gacha-card';

interface CharacterCardProps {
    character: Character;
}

export function CharacterCard({ character }: CharacterCardProps) {
    return (
        <motion.div
            key={character.id}
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
            }}
            className="h-full group"
        >
            <GachaCard character={character} />
        </motion.div>
    );
}
