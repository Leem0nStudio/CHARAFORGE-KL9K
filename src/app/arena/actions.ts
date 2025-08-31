
'use server';

import { getSupabaseServerClient } from '@/lib/supabase/server';
import { verifyAndGetUid } from '@/lib/auth/server';
import { toCharacterObject } from '@/services/character-hydrator';
import type { Character } from '@/types/character';

/**
 * Fetches a random opponent character for arena battles.
 * @param excludeId The ID of the player's character to exclude from selection.
 * @param playerRarity The rarity level of the player's character.
 * @returns A promise resolving to a random opponent character or null if none found.
 */
export async function getRandomOpponent(excludeId: string, playerRarity: number): Promise<Character | null> {
    try {
        const supabase = getSupabaseServerClient();
        
        // Get characters with the same rarity first
        const { data: sameRarityChars, error: sameError } = await supabase
            .from('characters')
            .select('*')
            .neq('id', excludeId)
            .eq('core_details->rarity', playerRarity)
            .limit(10);
            
        if (sameError) throw sameError;
        
        const opponents = sameRarityChars || [];
        
        // If not enough opponents with same rarity, get some with adjacent rarities
        const additionalOpponents: any[] = [];
        if (opponents.length < 3) {
            const [aboveRarity, belowRarity] = await Promise.all([
                supabase
                    .from('characters')
                    .select('*')
                    .neq('id', excludeId)
                    .eq('core_details->rarity', playerRarity + 1)
                    .limit(5),
                supabase
                    .from('characters')
                    .select('*')
                    .neq('id', excludeId)
                    .eq('core_details->rarity', playerRarity - 1)
                    .limit(5)
            ]);
            
            if (aboveRarity.data) additionalOpponents.push(...aboveRarity.data);
            if (belowRarity.data) additionalOpponents.push(...belowRarity.data);
        }
        
        const allOpponents = [...opponents, ...additionalOpponents];
        
        if (allOpponents.length === 0) {
            return null; // No suitable opponents found
        }
        
        // Convert to Character objects
        const characterPromises = allOpponents.map(async (char) => {
            return await toCharacterObject(char.id, char);
        });
        
        const characters = await Promise.all(characterPromises);
        const validOpponents = characters.filter(char => char.id !== excludeId);
        
        if (validOpponents.length === 0) {
            return null;
        }
        
        const randomIndex = Math.floor(Math.random() * validOpponents.length);
        return validOpponents[randomIndex];
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
    
    let attackPool = attacker.rpg.stats.strength || 5;
    let defensePool = defender.rpg.stats.dexterity || 5;
    
    let attackActionDescription = `${attacker.core.name} attacks`;
    if (attackSkill) {
        attackPool += attackSkill.power;
        attackActionDescription = `${attacker.core.name} uses ${attackSkill.name}`;
    }
    
    let defenseActionDescription = `${defender.core.name} defends`;
     if (defenseSkill) {
        defensePool += defenseSkill.power;
        defenseActionDescription = `${defender.core.name} uses ${defenseSkill.name}`;
    }

    // Roll dice and count successes (>= 6)
    const rollD10 = () => Math.floor(Math.random() * 10) + 1;
    const attackRolls = Array(attackPool).fill(0).map(rollD10);
    const defenseRolls = Array(defensePool).fill(0).map(rollD10);
    
    const attackSuccesses = attackRolls.filter(r => r >= 6).length;
    const defenseSuccesses = defenseRolls.filter(r => r >= 6).length;

    roundLog.push(`${attackActionDescription} with ${attackPool} dice (${attackSuccesses} successes).`);
    roundLog.push(`${defenseActionDescription} with ${defensePool} dice (${defenseSuccesses} successes).`);

    const netSuccesses = Math.max(0, attackSuccesses - defenseSuccesses);
    
    if (netSuccesses > 0) {
        roundLog.push(`The attack hits with ${netSuccesses} net successes, dealing ${netSuccesses} damage!`);
    } else {
        roundLog.push(`${defender.core.name} successfully blocks the attack!`);
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
    const uid = await verifyAndGetUid();
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

    // Determine winner and calculate XP
    const winner = playerHp > 0 ? player : opponent;
    const loser = playerHp > 0 ? opponent : player;
    const xpGained = Math.floor((loser.rpg.stats.constitution || 5) * 0.5);

    log.push(`--- Battle End ---`);
    log.push(`${winner.core.name} emerges victorious!`);
    log.push(`${winner.core.name} gains ${xpGained} XP from this battle.`);

    // Update character stats in database
    try {
        const supabase = getSupabaseServerClient();
        
        // Update winner's XP (stored separately from stats)
        const { error: updateError } = await supabase
            .from('characters')
            .update({ 
                rpg_details: {
                    ...winner.rpg,
                    experience: (winner.rpg.experience || 0) + xpGained
                }
            })
            .eq('id', winner.id);
            
        if (updateError) {
            console.error('Error updating winner XP:', updateError);
        }
    } catch (error) {
        console.error('Error updating character stats:', error);
    }

    return {
        log,
        winnerId: winner.id,
        xpGained
    };
}
