'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Character } from '@/types/character';
import { BackButton } from '@/components/back-button';
import { CharacterSelector } from '@/components/arena/character-selector';
import { BattleView } from './battle-view';

interface ArenaClientProps {
    userCharacters: Character[];
}

export function ArenaClient({ userCharacters }: ArenaClientProps) {
    const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

    return (
        <div className="container py-8">
            <BackButton 
                title="The Arena"
                description="Select your champion and test their might in battle."
            />
            
            <div className="max-w-7xl mx-auto mt-8">
                <AnimatePresence mode="wait">
                    {!selectedCharacter ? (
                        <motion.div
                            key="selector"
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 50 }}
                            transition={{ duration: 0.3 }}
                        >
                            <CharacterSelector
                                characters={userCharacters}
                                onSelectCharacter={setSelectedCharacter}
                            />
                        </motion.div>
                    ) : (
                         <motion.div
                            key="battle"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.3 }}
                        >
                            <BattleView
                                playerCharacter={selectedCharacter}
                                onExit={() => setSelectedCharacter(null)}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
