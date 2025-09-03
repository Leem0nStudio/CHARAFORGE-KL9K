
'use server';

import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { Character } from '@/types/character';
import { toCharacterObject } from '@/services/character-hydrator';
import { verifyAndGetUid } from '@/lib/auth/server';

/**
 * Fetches a random opponent from all public characters, matching the player's rarity.
 * @param playerRarity The rarity level (1-5) of the player's character.
 * @param excludeId The ID of the player's character to exclude from the opponent pool.
 * @returns A promise that resolves to a random opponent character or null if none are found.
 */
export async function getRandomOpponent(playerRarity: number, excludeId: string): Promise<Character | null> {
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
        console.error('Database service is unavailable.');
        return null;
    }

    try {
        const { data, error } = await supabase
            .from('characters')
            .select('*')
            .eq('meta_details->>status', 'public')
            .eq('rpg_details->>isPlayable', true)
            .eq('core_details->>rarity', playerRarity)
            .neq('id', excludeId)
            .limit(50); // Limit to 50 potential opponents
        
        if (error) throw error;
        
        let opponents: Character[] = [];
        if (data) {
            opponents = await Promise.all(data.map(d => toCharacterObject(d.id, d)));
        }

        if (opponents.length === 0) {
            // If no exact match, try to find one rarity level below or above
            const [belowResponse, aboveResponse] = await Promise.all([
                 supabase.from('characters').select('*').eq('meta_details->>status', 'public').eq('rpg_details->>isPlayable', true).eq('core_details->>rarity', playerRarity - 1).limit(10),
                 supabase.from('characters').select('*').eq('meta_details->>status', 'public').eq('rpg_details->>isPlayable', true).eq('core_details->>rarity', playerRarity + 1).limit(10)
            ]);

            const belowData = belowResponse.data || [];
            const aboveData = aboveResponse.data || [];
            
            const belowOpponents = await Promise.all(belowData.map(d => toCharacterObject(d.id, d)));
            const aboveOpponents = await Promise.all(aboveData.map(d => toCharacterObject(d.id, d)));

            opponents.push(...belowOpponents, ...aboveOpponents);
            opponents = opponents.filter(char => char.id !== excludeId);
        }
        
        if (opponents.length === 0) {
            return null; // No suitable opponents found
        }
        
        const randomIndex = Math.floor(Math.random() * opponents.length);
        return opponents[randomIndex]!;
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
    await verifyAndGetUid();
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
        
        const supabase = await getSupabaseServerClient();
        if (supabase) {
             const { error } = await supabase.rpc('increment_experience', { character_id: player.id, xp_to_add: xpGained });
             if (error) console.error("Failed to increment experience:", error);
             else log.push(`${player.core.name} gained ${xpGained} XP!`);
        }
        
    } else {
        winnerId = opponent.id;
        log.push(`${opponent.core.name} is victorious!`);
    }

    return { log, winnerId, xpGained };
}
