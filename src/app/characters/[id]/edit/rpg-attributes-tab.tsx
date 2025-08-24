
'use client';

import type { Character } from '@/types/character';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dna, Swords, Shield, BrainCircuit, AlertCircle, Info } from 'lucide-react';
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
                 <div className="flex items-center gap-1.5">
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
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>RPG Attributes</CardTitle>
                    <CardDescription>View your character's combat stats and skills. These are used in game modes like the Arena.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {isPlayable ? (
                        <div className="grid lg:grid-cols-2 gap-6">
                            <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                                <h3 className="font-semibold flex items-center gap-2"><Dna className="text-primary"/> Base Stats</h3>
                                {statsAreSet ? (
                                    <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-3 gap-2">
                                        <StatDisplay label="STR" value={rpg.stats.strength} />
                                        <StatDisplay label="DEX" value={rpg.stats.dexterity} />
                                        <StatDisplay label="CON" value={rpg.stats.constitution} />
                                        <StatDisplay label="INT" value={rpg.stats.intelligence} />
                                        <StatDisplay label="WIS" value={rpg.stats.wisdom} />
                                        <StatDisplay label="CHA" value={rpg.stats.charisma} />
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Stats are not yet generated.</p>
                                )}
                            </div>
                            <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                                <h3 className="font-semibold flex items-center gap-2"><Swords className="text-primary"/> Combat Skills</h3>
                                {skillsAreSet ? (
                                    <div className="space-y-2">
                                        {rpg.skills.map(skill => <SkillDisplay key={skill.id} skill={skill} />)}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No skills have been generated yet for this character.</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Not a Playable Character</AlertTitle>
                            <AlertDescription>
                                This character cannot have RPG attributes because it does not have an Archetype/Class assigned. Go to the "Details & Lore" tab to assign one.
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

             <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>How Attributes Are Generated</AlertTitle>
                <AlertDescription>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                        <li><strong>Stats:</strong> Base stats are automatically calculated and saved when you assign or change a character's Archetype in the "Details & Lore" tab.</li>
                        <li><strong>Skills:</strong> Skills are automatically generated by an AI when you process an image for the showcase in the "Gallery" tab.</li>
                    </ul>
                </AlertDescription>
            </Alert>
        </div>
    );
}

  