

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
