
'use client';

import { useState, useTransition } from 'react';
import type { Character, RpgAttributes } from '@/types/character';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dna, Swords, Shield, BrainCircuit, AlertCircle, Info, Pilcrow } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { rollForCharacterStats } from '@/app/actions/character-write';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

function StatDisplay({ label, value, group }: { label: string; value: number, group: 'physical' | 'social' | 'mental' }) {
    const groupColors = {
        physical: 'text-destructive',
        social: 'text-green-500',
        mental: 'text-blue-500'
    }
    return (
        <div className="flex flex-col items-center justify-center p-2 border rounded-lg bg-background text-center">
            <span className={`text-xs ${groupColors[group]} font-semibold`}>{label.substring(0, 3).toUpperCase()}</span>
            <span className="text-xl font-bold">{value}</span>
        </div>
    );
}

function SkillDisplay({ skill }: { skill: Character['rpg']['skills'][0]}) {
    const iconMap = {
        attack: <Swords className="text-destructive w-4 h-4" />,
        defense: <Shield className="text-blue-500 w-4 h-4" />,
        utility: <BrainCircuit className="text-green-500 w-4 h-4" />,
    }

    return (
        <div className="p-3 border rounded-lg bg-background">
            <div className="flex justify-between items-start">
                <h4 className="font-semibold text-sm">{skill.name}</h4>
                 <div className="flex items-center gap-1.5">
                     <span className="text-xs font-bold text-primary">{skill.power}</span>
                     {iconMap[skill.type]}
                 </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{skill.description}</p>
        </div>
    )
}

function Dice({ value }: { value: number }) {
    return (
        <div className="w-12 h-12 bg-card border rounded-md flex items-center justify-center text-xl font-bold text-primary">
            {value}
        </div>
    );
}


export function RpgAttributesTab({ character }: { character: Character }) {
    const { toast } = useToast();
    const router = useRouter();
    const [isRolling, startRollTransition] = useTransition();
    const [diceValues, setDiceValues] = useState<number[]>([1,1,1,1,1,1]);
    const [stats, setStats] = useState<RpgAttributes['stats']>(character.rpg.stats);

    const handleRollStats = () => {
        startRollTransition(async () => {
            let rollCount = 0;
            const interval = setInterval(() => {
                const newDice = Array(6).fill(0).map(() => Math.floor(Math.random() * 20) + 1);
                setDiceValues(newDice);
                rollCount++;
                if (rollCount > 10) {
                    clearInterval(interval);
                    getFinalStats();
                }
            }, 100);
        });
    }

    const getFinalStats = async () => {
        const result = await rollForCharacterStats(character.id);
        if (result.success && result.newStats) {
            setStats(result.newStats);
            setDiceValues(Object.values(result.newStats));
            toast({ title: 'Stats Generated!', description: 'Your character attributes have been set.' });
            router.refresh();
        } else {
            toast({ variant: 'destructive', title: 'Roll Failed', description: result.message });
        }
    }

    const rpg = character.rpg;
    const isPlayable = rpg?.isPlayable;
    const statsAreSet = stats.strength > 0;
    const skillsAreSet = rpg?.skills.length > 0;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>RPG Attributes</CardTitle>
                    <CardDescription>Roll for your character's combat stats and manage their skills.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {!isPlayable ? (
                         <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Not a Playable Character</AlertTitle>
                            <AlertDescription>
                                This character cannot have RPG attributes because it does not have an Archetype/Class assigned. Go to the "Details & Lore" tab to assign one.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-semibold text-lg flex items-center gap-2 mb-2"><Dna className="text-primary"/> Base Attributes</h3>
                                <div className="p-4 rounded-lg border bg-muted/30">
                                    {!statsAreSet ? (
                                        <div className="flex flex-col items-center justify-center text-center gap-4 p-4 bg-background rounded-lg">
                                            <div className="flex gap-2">
                                                {diceValues.map((v, i) => (
                                                    <Dice key={i} value={v} />
                                                ))}
                                            </div>
                                             <Button onClick={handleRollStats} disabled={isRolling}>
                                                {isRolling ? <Loader2 className="animate-spin mr-2" /> : <Dna className="mr-2"/>}
                                                Roll for Stats
                                            </Button>
                                            <p className="text-xs text-muted-foreground">Uses the 4d6 drop lowest method, assigned based on Archetype.</p>
                                        </div>
                                    ) : (
                                        <motion.div 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="space-y-4"
                                        >
                                            <div className="grid grid-cols-3 gap-2">
                                                <StatDisplay label="Strength" value={stats.strength} group="physical" />
                                                <StatDisplay label="Dexterity" value={stats.dexterity} group="physical" />
                                                <StatDisplay label="Constitution" value={stats.constitution} group="physical" />
                                            </div>
                                             <div className="grid grid-cols-3 gap-2">
                                                <StatDisplay label="Charisma" value={stats.charisma} group="social" />
                                                <StatDisplay label="Intelligence" value={stats.intelligence} group="mental" />
                                                <StatDisplay label="Wisdom" value={stats.wisdom} group="mental" />
                                            </div>
                                             <Button onClick={handleRollStats} disabled={isRolling} variant="outline" size="sm" className="w-full mt-2">
                                                {isRolling ? <Loader2 className="animate-spin mr-2" /> : <Dna className="mr-2"/>}
                                                Re-roll Attributes
                                            </Button>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                             <div>
                                <h3 className="font-semibold text-lg flex items-center gap-2 mb-2"><Pilcrow className="text-primary"/> Skills & Talents</h3>
                                 <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                                    {skillsAreSet ? (
                                        <div className="space-y-2">
                                            {rpg.skills.map(skill => <SkillDisplay key={skill.id} skill={skill} />)}
                                        </div>
                                    ) : (
                                        <div className="text-center text-muted-foreground py-8">
                                            <p className="text-sm">No skills have been generated yet.</p>
                                            <p className="text-xs mt-1">Skills are automatically generated by the AI after an image has been processed for the showcase.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

             <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>How Attributes Are Generated</AlertTitle>
                <AlertDescription>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                        <li><strong>Attributes:</strong> Click the "Roll for Attributes" button to generate base stats for your character. You can re-roll them at any time.</li>
                        <li><strong>Skills:</strong> Skills are automatically generated by an AI when you process a primary image for the showcase in the "Gallery" tab.</li>
                    </ul>
                </AlertDescription>
            </Alert>
        </div>
    );
}
