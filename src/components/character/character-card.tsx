
'use client';

import { motion } from 'framer-motion';
import type { Character } from '@/types/character';
import { CharacterIndexCard } from './character-index-card';

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
            <CharacterIndexCard character={character} />
        </motion.div>
    );
}
