

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
 * Simulates a battle round using the D10 dice pool system.
 * @param attacker The attacking character.
 * @param defender The defending character.
 * @returns An object containing the attack log and damage dealt.
 */
function simulateRound(attacker: Character, defender: Character): { roundLog: string[]; damage: number } {
    const roundLog: string[] = [];
    
    // Determine dice pools
    const attackSkill = attacker.rpg.skills.find(s => s.type === 'attack');
    const defenseSkill = defender.rpg.skills.find(s => s.type === 'defense');
    const attackPool = (attacker.rpg.stats.strength || 5) + (attackSkill?.power || 0);
    const defensePool = (defender.rpg.stats.dexterity || 5) + (defenseSkill?.power || 0);

    // Roll dice and count successes (>= 6)
    const rollD10 = () => Math.floor(Math.random() * 10) + 1;
    const attackRolls = Array(attackPool).fill(0).map(rollD10);
    const defenseRolls = Array(defensePool).fill(0).map(rollD10);
    
    const attackSuccesses = attackRolls.filter(r => r >= 6).length;
    const defenseSuccesses = defenseRolls.filter(r => r >= 6).length;

    roundLog.push(`${attacker.core.name} attacks with ${attackPool} dice (${attackSuccesses} successes).`);
    roundLog.push(`${defender.core.name} defends with ${defensePool} dice (${defenseSuccesses} successes).`);

    const netSuccesses = Math.max(0, attackSuccesses - defenseSuccesses);
    
    if (netSuccesses > 0) {
        roundLog.push(`The attack hits with ${netSuccesses} net successes, dealing ${netSuccesses} damage!`);
    } else {
        roundLog.push(`${defender.core.name} successfully defends the attack!`);
    }
    
    return { roundLog, damage: netSuccesses };
}


/**
 * Simulates a battle and returns the log and winner.
 * @param player Player's character object.
 * @param opponent Opponent's character object.
 * @returns A promise resolving to the battle outcome.
 */
export async function simulateBattle(player: Character, opponent: Character): Promise<{ log: string[]; winnerId: string; xpGained: number }> {
    const log: string[] = [];
    let playerHp = (player.rpg.stats.constitution || 5) * 2; // More health for longer fights
    let opponentHp = (opponent.rpg.stats.constitution || 5) * 2;

    log.push(`${player.core.name} (HP: ${playerHp}) faces ${opponent.core.name} (HP: ${opponentHp})!`);
    log.push('The battle begins!');
    
    while (playerHp > 0 && opponentHp > 0) {
        // Player's turn
        log.push(`--- ${player.core.name}'s Turn ---`);
        const playerAttack = simulateRound(player, opponent);
        opponentHp -= playerAttack.damage;
        log.push(...playerAttack.roundLog);
        log.push(`${opponent.core.name} has ${Math.max(0, opponentHp)} HP remaining.`);
        if (opponentHp <= 0) break;

        // Opponent's turn
        log.push(`--- ${opponent.core.name}'s Turn ---`);
        const opponentAttack = simulateRound(opponent, player);
        playerHp -= opponentAttack.damage;
        log.push(...opponentAttack.roundLog);
        log.push(`${player.core.name} has ${Math.max(0, playerHp)} HP remaining.`);
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
