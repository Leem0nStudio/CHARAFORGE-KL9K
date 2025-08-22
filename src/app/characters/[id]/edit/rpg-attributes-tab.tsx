
'use client';

import type { Character } from '@/types/character';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dna, Swords, Shield, BrainCircuit, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function StatDisplay({ label, value }: { label: string; value: number }) {
    return (
        <div className="flex flex-col items-center justify-center p-2 border rounded-lg bg-background text-center">
            <span className="text-xs text-muted-foreground">{label.substring(0, 3).toUpperCase()}</span>
            <span className="text-xl font-bold text-primary">{value}</span>
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
                 <div className="flex items-center gap-1">
                     <span className="text-xs font-bold text-primary">{skill.power}</span>
                     {iconMap[skill.type]}
                 </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{skill.description}</p>
        </div>
    )
}

export function RpgAttributesTab({ character }: { character: Character }) {
    const rpg = character.rpg;
    const isPlayable = rpg?.isPlayable;
    const statsAreSet = rpg?.stats.strength > 0;
    const skillsAreSet = rpg?.skills.length > 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle>RPG Attributes</CardTitle>
                <CardDescription>Generate and view the character's combat stats and skills. An Archetype must be set.</CardDescription>
            </CardHeader>
            <CardContent>
                {isPlayable ? (
                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                            <h3 className="font-semibold flex items-center gap-2"><Dna className="text-primary"/> Base Stats</h3>
                            {statsAreSet ? (
                                <div className="grid grid-cols-3 gap-2">
                                    <StatDisplay label="STR" value={rpg.stats.strength} />
                                    <StatDisplay label="DEX" value={rpg.stats.dexterity} />
                                    <StatDisplay label="CON" value={rpg.stats.constitution} />
                                    <StatDisplay label="INT" value={rpg.stats.intelligence} />
                                    <StatDisplay label="WIS" value={rpg.stats.wisdom} />
                                    <StatDisplay label="CHA" value={rpg.stats.charisma} />
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">Stats are generated automatically when you save the character with an Archetype.</p>
                            )}
                        </div>
                        <div className="lg:col-span-2 space-y-4 p-4 rounded-lg border bg-muted/30">
                            <h3 className="font-semibold flex items-center gap-2"><Swords className="text-primary"/> Combat Skills</h3>
                            {skillsAreSet ? (
                                <div className="space-y-2">
                                    {rpg.skills.map(skill => <SkillDisplay key={skill.id} skill={skill} />)}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No skills generated yet. Click "Generate" to create them.</p>
                            )}
                            <Button disabled>
                                <RefreshCw className="mr-2"/>
                                Regenerate Skills (Coming Soon)
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Not a Playable Character</AlertTitle>
                        <AlertDescription>
                            This character is not playable because it does not have an Archetype/Class assigned. Go to the "Details & Lore" tab to assign one. Once saved, you can view the generated attributes here.
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}
