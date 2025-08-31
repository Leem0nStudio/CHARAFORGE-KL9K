// PLAN: This component is being deprecated in favor of the new, more visually rich `GachaCard`.
// Its logic will be merged into `GachaCard.tsx`.
// For now, it will simply re-export the `GachaCard` to maintain compatibility during the transition.
'use client';

import React from 'react';
import type { Character } from '@/types/character';
import { GachaCard } from './gacha-card';

export const CharacterIndexCard: React.FC<{ character: Character }> = ({ character }) => {
  return <GachaCard character={character} />;
};
