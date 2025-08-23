
'use client';

import { useState, useTransition, useEffect } from 'react';
import type { Character } from '@/types/character';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GachaCard } from '../character/gacha-card';
import { ArrowLeft, Swords, Dna, Loader2, RefreshCw } from 'lucide-react';
import { simulateBattle, getRandomOpponent } from '@/app/arena/actions';

interface BattleViewProps {
    playerCharacter: Character;
    onExit: () => void;
}

function CombatantCard({ character }: { character: Character }) {
    const stats = character.rpg.stats;
    return (
        <div className="flex flex-col items-center gap-4">
            <div className="w-full max-w-[300px]">
                <GachaCard character={character} />
            </div>
            <Card className="w-full max-w-[300px] bg-card/50">
                 <CardContent className="p-3">
                     <p className="font-semibold text-center text-lg">{character.core.name}</p>
                     <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                        <div className="p-1 border rounded-md"><span className="text-xs text-muted-foreground">STR</span><p>{stats.strength}</p></div>
                        <div className="p-1 border rounded-md"><span className="text-xs text-muted-foreground">DEX</span><p>{stats.dexterity}</p></div>
                        <div className="p-1 border rounded-md"><span className="text-xs text-muted-foreground">INT</span><p>{stats.intelligence}</p></div>
                     </div>
                </CardContent>
            </Card>
        </div>
    );
}

export function BattleView({ playerCharacter, onExit }: BattleViewProps) {
    const [opponent, setOpponent] = useState<Character | null>(null);
    const [battleLog, setBattleLog] = useState<string[]>([]);
    const [isFighting, startFightTransition] = useTransition();
    const [isLoadingOpponent, startOpponentTransition] = useTransition();
    const [winnerId, setWinnerId] = useState<string | null>(null);

    const findNewOpponent = () => {
        startOpponentTransition(async () => {
            setWinnerId(null);
            setBattleLog([]);
            const newOpponent = await getRandomOpponent(playerCharacter.core.rarity, playerCharacter.id);
            setOpponent(newOpponent);
            setBattleLog([newOpponent ? 'A new challenger approaches!' : 'No opponents found.']);
        });
    };

    useEffect(() => {
        findNewOpponent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playerCharacter]);


    const handleFight = () => {
        if (!opponent) return;
        
        startFightTransition(async () => {
            const result = await simulateBattle(playerCharacter, opponent);
            setBattleLog(result.log);
            setWinnerId(result.winnerId);
        });
    };

    const isLoading = isFighting || isLoadingOpponent;

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="outline" onClick={onExit}><ArrowLeft className="mr-2"/> Change Champion</Button>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 items-start">
                <CombatantCard character={playerCharacter} />

                <div className="flex flex-col items-center gap-4">
                     <div className="font-headline text-5xl text-destructive -my-2">VS</div>
                     <Button 
                        size="lg" 
                        className="w-full font-headline text-xl"
                        onClick={handleFight}
                        disabled={!opponent || isLoading || !!winnerId}
                     >
                        {isLoading ? <Loader2 className="mr-2 animate-spin" /> : <Swords className="mr-2" />}
                        FIGHT!
                    </Button>
                    
                    {winnerId && (
                        <Button size="lg" className="w-full" onClick={findNewOpponent} disabled={isLoading}>
                             <RefreshCw className="mr-2"/> Find New Opponent
                        </Button>
                    )}

                    <Card className="w-full">
                        <CardHeader>
                            <CardTitle className="text-lg">Battle Log</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-48">
                                <div className="space-y-2 text-sm text-muted-foreground">
                                    {battleLog.map((log, i) => <p key={i}>{log}</p>)}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex flex-col items-center gap-4">
                    {opponent ? (
                        <CombatantCard character={opponent} />
                    ) : (
                        <div className="w-full max-w-[300px] aspect-[1/1.5] bg-muted/20 border-2 border-dashed rounded-lg flex items-center justify-center">
                            {isLoadingOpponent ? <Loader2 className="h-8 w-8 animate-spin" /> : <p className="text-muted-foreground">No Opponent</p>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
