
'use server';

import { adminDb } from '@/lib/firebase/server';
import type { Character } from '@/types/character';
import { toCharacterObject } from '@/services/character-hydrator';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Fetches a random opponent from all public characters, matching the player's rarity.
 * @param playerRarity The rarity level (1-5) of the player's character.
 * @param excludeId The ID of the player's character to exclude from the opponent pool.
 * @returns A promise that resolves to a random opponent character or null if none are found.
 */
export async function getRandomOpponent(playerRarity: number, excludeId: string): Promise<Character | null> {
    if (!adminDb) {
        console.error('Database service is unavailable.');
        return null;
    }

    try {
        const q = adminDb.collection('characters')
            .where('meta.status', '==', 'public')
            .where('rpg.isPlayable', '==', true)
            .where('core.rarity', '==', playerRarity);
        
        const snapshot = await q.get();

        if (snapshot.empty) {
            // If no exact match, try to find one rarity level below or above
            const [belowSnapshot, aboveSnapshot] = await Promise.all([
                 adminDb.collection('characters').where('core.rarity', '==', playerRarity - 1).limit(10).get(),
                 adminDb.collection('characters').where('core.rarity', '==', playerRarity + 1).limit(10).get()
            ]);
            snapshot.docs.push(...belowSnapshot.docs);
            snapshot.docs.push(...aboveSnapshot.docs);
        }
        
        const opponents = snapshot.docs
            .map(doc => toCharacterObject(doc.id, doc.data()))
            .filter(char => char.id !== excludeId);

        if (opponents.length === 0) {
            return null; // No suitable opponents found
        }
        
        const randomIndex = Math.floor(Math.random() * opponents.length);
        return opponents[randomIndex];
    } catch (error) {
        console.error("Error fetching random opponent:", error);
        return null;
    }
}

/**
 * Simulates a battle and returns the log and winner.
 * @param player Player's character object.
 * @param opponent Opponent's character object.
 * @returns A promise resolving to the battle outcome.
 */
export async function simulateBattle(player: Character, opponent: Character): Promise<{ log: string[]; winnerId: string; xpGained: number }> {
    const log: string[] = [];
    let playerHp = (player.rpg.stats.constitution || 5) * 10;
    let opponentHp = (opponent.rpg.stats.constitution || 5) * 10;

    log.push(`${player.core.name} (HP: ${playerHp}) faces ${opponent.core.name} (HP: ${opponentHp})!`);
    log.push('The battle begins!');
    
    const calculateDamage = (attacker: Character) => {
        const baseDamage = attacker.rpg.stats.strength || 5;
        const critChance = (attacker.rpg.stats.dexterity || 5) / 20; // e.g., 10 DEX = 50% crit chance for 1.5x damage
        const isCrit = Math.random() < critChance;
        const damage = isCrit ? Math.floor(baseDamage * 1.5) : baseDamage;
        if(isCrit) log.push('Critical Hit!');
        return damage;
    }

    while (playerHp > 0 && opponentHp > 0) {
        // Player's turn
        const playerDamage = calculateDamage(player);
        opponentHp -= playerDamage;
        log.push(`${player.core.name} attacks for ${playerDamage} damage! ${opponent.core.name} has ${Math.max(0, opponentHp)} HP remaining.`);
        if (opponentHp <= 0) break;

        // Opponent's turn
        const opponentDamage = calculateDamage(opponent);
        playerHp -= opponentDamage;
        log.push(`${opponent.core.name} retaliates for ${opponentDamage} damage! ${player.core.name} has ${Math.max(0, playerHp)} HP remaining.`);
    }
    
    let winnerId = '';
    let xpGained = 0;

    if (playerHp > 0) {
        winnerId = player.id;
        log.push(`${player.core.name} is victorious!`);
        xpGained = 10 + (opponent.core.rarity - player.core.rarity) * 5; // XP based on rarity difference
        xpGained = Math.max(5, xpGained); // Minimum 5 XP
        
        if (adminDb) {
            await adminDb.collection('characters').doc(player.id).update({
                'rpg.experience': FieldValue.increment(xpGained)
            });
             log.push(`${player.core.name} gained ${xpGained} XP!`);
        }
        
    } else {
        winnerId = opponent.id;
        log.push(`${opponent.core.name} is victorious!`);
    }

    return { log, winnerId, xpGained };
}
