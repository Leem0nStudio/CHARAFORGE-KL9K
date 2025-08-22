

'use client';

import { useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Character } from '@/types/character';
import { updateCharacter } from '@/app/actions/character-write';
import { regenerateCharacterSheet } from '@/app/actions/generation';
import { triggerStatGeneration, triggerSkillGeneration } from '@/app/actions/rpg';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Wand2, Dna, Swords, Shield, BrainCircuit, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { StarRating } from '@/components/showcase/star-rating';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { rpgArchetypes } from '@/lib/app-config';


const alignmentOptions = [
    'Lawful Good', 'Neutral Good', 'Chaotic Good', 
    'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
    'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'
] as const;

const FormSchema = z.object({
  name: z.string().min(1, "Name is required.").max(100, "Name cannot exceed 100 characters."),
  archetype: z.string().optional(),
  equipment: z.array(z.string()).optional(),
  biography: z.string().min(1, "Biography is required.").max(15000, "Biography is too long."),
  alignment: z.enum(alignmentOptions),
  physicalDescription: z.string().optional(),
});
type FormValues = z.infer<typeof FormSchema>;

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

export function EditDetailsTab({ character }: { character: Character }) {
    const { toast } = useToast();
    const router = useRouter();
    const [isUpdating, startUpdateTransition] = useTransition();
    const [isRegenerating, startRegenerateTransition] = useTransition();
    const [isRpgGenerating, startRpgGenerateTransition] = useTransition();

    const form = useForm<FormValues>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            name: character.core.name,
            archetype: character.core.archetype || '',
            equipment: character.core.equipment || [],
            biography: character.core.biography,
            alignment: character.core.alignment || 'True Neutral',
            physicalDescription: character.core.physicalDescription || character.generation?.originalPrompt,
        },
    });

    const onSubmit = (data: FormValues) => {
        const dataToSave = {
            ...data,
            archetype: data.archetype === 'no-class' ? undefined : data.archetype,
        };
        startUpdateTransition(async () => {
            const result = await updateCharacter(character.id, dataToSave);
            toast({
                title: result.success ? 'Success!' : 'Update Failed',
                description: result.message,
                variant: result.success ? 'default' : 'destructive',
            });
            if (result.success) {
                router.refresh();
            }
        });
    };

    const handleRegenerateBio = () => {
        startRegenerateTransition(async () => {
            try {
                const originalPrompt = character.generation.originalPrompt || '';
                if (!originalPrompt) {
                    toast({ variant: 'destructive', title: 'Missing Context', description: 'Cannot regenerate without an original prompt.' });
                    return;
                }
                const result = await regenerateCharacterSheet(originalPrompt, 'English');

                if (result.success && result.data) {
                    form.setValue('biography', result.data.biography || '', { shouldDirty: true });
                    form.setValue('physicalDescription', result.data.physicalDescription || '', { shouldDirty: true });
                    toast({
                        title: 'Content Regenerated!',
                        description: 'A new biography and physical description have been generated. Don\'t forget to save your changes.',
                    });
                } else {
                    throw new Error(result.error || 'The AI failed to return valid content.');
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : "An unknown error occurred.";
                toast({ variant: 'destructive', title: 'Generation Failed', description: message });
            }
        });
    };
    
    const handleGenerateRpgAttributes = () => {
        if (!character.core.archetype) {
            toast({ variant: 'destructive', title: 'Archetype Required', description: 'Please assign a class/archetype to the character before generating attributes.'});
            return;
        }
        startRpgGenerateTransition(async () => {
            toast({ title: 'Generation Started', description: 'Requesting stats and skills from the AI...' });
            const [statsResult, skillsResult] = await Promise.all([
                triggerStatGeneration(character.id),
                triggerSkillGeneration(character.id)
            ]);

            if (statsResult.success && skillsResult.success) {
                 toast({ title: 'RPG Attributes Generated!', description: 'The character is ready for battle.'});
            } else {
                 toast({ variant: 'destructive', title: 'Generation Failed', description: statsResult.error || skillsResult.error || 'An unknown error occurred.'});
            }
            router.refresh();
        });
    };

    const rpg = character.rpg;
    const isPlayable = rpg?.isPlayable;
    const statsPending = rpg?.statsStatus === 'pending';
    const skillsPending = rpg?.skillsStatus === 'pending';
    const statsComplete = rpg?.statsStatus === 'complete';
    const skillsComplete = rpg?.skillsStatus === 'complete';

    return (
        <Card>
            <CardHeader>
                <CardTitle>Core Details</CardTitle>
                <CardDescription>Modify the character's story and defining attributes.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Character Name</Label>
                            <Input id="name" {...form.register('name')} />
                            {form.formState.errors.name && <p className="text-sm font-medium text-destructive">{form.formState.errors.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="archetype">Archetype / Class</Label>
                            <Controller
                                name="archetype"
                                control={form.control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value || 'no-class'}>
                                        <SelectTrigger id="archetype"><SelectValue placeholder="Select a class..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="no-class">No Class</SelectItem>
                                            {rpgArchetypes.map(option => (
                                                <SelectItem key={option} value={option}>{option}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="alignment">Alignment</Label>
                            <Controller
                                name="alignment"
                                control={form.control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {alignmentOptions.map(option => (
                                                <SelectItem key={option} value={option}>{option}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {form.formState.errors.alignment && <p className="text-sm font-medium text-destructive">{form.formState.errors.alignment.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="equipment">Equipment (comma-separated)</Label>
                            <Controller
                                name="equipment"
                                control={form.control}
                                render={({ field }) => (
                                    <Input
                                        id="equipment"
                                        value={Array.isArray(field.value) ? field.value.join(', ') : ''}
                                        onChange={(e) => field.onChange(e.target.value.split(',').map(item => item.trim()).filter(Boolean))}
                                    />
                                )}
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        <Label>Rarity</Label>
                        <StarRating rating={character.core.rarity || 1} />
                         <p className="text-xs text-muted-foreground">Rarity is automatically calculated based on the character's generated stats.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="physicalDescription">Physical Description (for Image Generation)</Label>
                        <Textarea id="physicalDescription" {...form.register('physicalDescription')} className="min-h-[150px] w-full" />
                    </div>
                
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="biography">Biography</Label>
                            <Button type="button" variant="outline" size="sm" onClick={handleRegenerateBio} disabled={isRegenerating}>
                                {isRegenerating ? <Loader2 className="mr-2 animate-spin" /> : <Wand2 className="mr-2" />}
                                Regenerate All Text
                            </Button>
                        </div>
                        <Textarea id="biography" {...form.register('biography')} className="min-h-[250px] w-full" />
                        {form.formState.errors.biography && <p className="text-sm font-medium text-destructive">{form.formState.errors.biography.message}</p>}
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="submit" disabled={isUpdating || !form.formState.isDirty}>
                            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Details
                        </Button>
                    </div>
                </form>

                <Separator className="my-8" />
                
                {/* RPG Stats Section */}
                <div>
                     <CardHeader className="p-0 mb-4">
                        <CardTitle>RPG Attributes</CardTitle>
                        <CardDescription>Generate and view the character's combat stats and skills. An Archetype must be set.</CardDescription>
                    </CardHeader>
                     {isPlayable ? (
                        <div className="grid lg:grid-cols-3 gap-8">
                             <div className="space-y-6">
                                <div className="p-4 rounded-lg border bg-muted/30">
                                    <h3 className="font-semibold mb-3 flex items-center gap-2"><Dna className="text-primary"/> Base Stats</h3>
                                    {statsPending ? (
                                        <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="animate-spin" /> Generating stats...</div>
                                    ) : statsComplete ? (
                                        <div className="grid grid-cols-3 gap-2">
                                            <StatDisplay label="STR" value={rpg.stats.strength} />
                                            <StatDisplay label="DEX" value={rpg.stats.dexterity} />
                                            <StatDisplay label="CON" value={rpg.stats.constitution} />
                                            <StatDisplay label="INT" value={rpg.stats.intelligence} />
                                            <StatDisplay label="WIS" value={rpg.stats.wisdom} />
                                            <StatDisplay label="CHA" value={rpg.stats.charisma} />
                                        </div>
                                    ) : (
                                         <p className="text-sm text-muted-foreground">Stats are ready to be generated.</p>
                                    )}
                                </div>
                                <Button onClick={handleGenerateRpgAttributes} disabled={isRpgGenerating || statsPending || skillsPending}>
                                    {isRpgGenerating && <Loader2 className="animate-spin mr-2"/>}
                                    {statsComplete ? 'Regenerate Attributes' : 'Generate Attributes'}
                                </Button>
                             </div>
                             <div className="lg:col-span-2 p-4 rounded-lg border bg-muted/30">
                                <h3 className="font-semibold mb-3 flex items-center gap-2"><Swords className="text-primary"/> Combat Skills</h3>
                                <div className="space-y-2">
                                    {skillsPending ? (
                                        <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="animate-spin" /> Generating skills...</div>
                                    ) : skillsComplete && rpg.skills.length > 0 ? (
                                        rpg.skills.map(skill => <SkillDisplay key={skill.id} skill={skill} />)
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No skills generated yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                     ) : (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Not a Playable Character</AlertTitle>
                            <AlertDescription>
                                This character is not playable because it does not have an Archetype/Class assigned. Edit the character details to assign one.
                            </AlertDescription>
                        </Alert>
                     )}
                </div>
            </CardContent>
        </Card>
    );
}
