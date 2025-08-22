
'use client';

import { useState, useTransition } from 'react';
import type { Character } from '@/types/character';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GachaCard } from '../character/gacha-card';
import { ArrowLeft, Swords, Dna, Loader2 } from 'lucide-react';

interface BattleViewProps {
    playerCharacter: Character;
    opponents: Character[];
    onExit: () => void;
}

function CombatantCard({ character, isPlayer = false }: { character: Character, isPlayer?: boolean }) {
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


export function BattleView({ playerCharacter, opponents, onExit }: BattleViewProps) {
    const [selectedOpponent, setSelectedOpponent] = useState<Character | null>(opponents[0] || null);
    const [battleLog, setBattleLog] = useState<string[]>(['The arena is silent. The battle is about to begin...']);
    const [isFighting, startFightTransition] = useTransition();

    const handleFight = () => {
        if (!selectedOpponent) return;
        
        startFightTransition(async () => {
            // Placeholder for battle logic
            setBattleLog(['Simulating battle...']);
            await new Promise(resolve => setTimeout(resolve, 1500));
            setBattleLog(prev => [...prev, `${playerCharacter.core.name} attacks ${selectedOpponent.core.name}!`]);
            await new Promise(resolve => setTimeout(resolve, 1000));
            setBattleLog(prev => [...prev, `${selectedOpponent.core.name} retaliates!`]);
             await new Promise(resolve => setTimeout(resolve, 1000));
            setBattleLog(prev => [...prev, `${playerCharacter.core.name} is victorious!`]);
        });
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="outline" onClick={onExit}><ArrowLeft className="mr-2"/> Change Champion</Button>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 items-start">
                <CombatantCard character={playerCharacter} isPlayer />

                <div className="flex flex-col items-center gap-4">
                     <div className="font-headline text-5xl text-destructive -my-2">VS</div>
                     <Button 
                        size="lg" 
                        className="w-full font-headline text-xl"
                        onClick={handleFight}
                        disabled={!selectedOpponent || isFighting}
                     >
                        {isFighting ? <Loader2 className="mr-2 animate-spin" /> : <Swords className="mr-2" />}
                        FIGHT!
                    </Button>
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
                    {selectedOpponent ? (
                        <CombatantCard character={selectedOpponent} />
                    ) : (
                        <div className="w-full max-w-[300px] aspect-[0.75] bg-muted/20 border-2 border-dashed rounded-lg flex items-center justify-center">
                            <p className="text-muted-foreground">No Opponent</p>
                        </div>
                    )}
                    <Select
                        onValueChange={(id) => setSelectedOpponent(opponents.find(o => o.id === id) || null)}
                        defaultValue={selectedOpponent?.id}
                        disabled={isFighting}
                    >
                        <SelectTrigger className="w-full max-w-[300px]">
                            <SelectValue placeholder="Select an Opponent" />
                        </SelectTrigger>
                        <SelectContent>
                            {opponents.map(opp => (
                                <SelectItem key={opp.id} value={opp.id}>
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={opp.visuals.imageUrl} />
                                            <AvatarFallback>{opp.core.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span>{opp.core.name}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}

