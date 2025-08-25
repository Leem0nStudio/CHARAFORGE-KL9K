
'use client';

import { useTransition, useEffect, useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Character, TimelineEvent } from '@/types/character';
import { updateCharacter, updateCharacterTimeline, suggestNextTimelineEvent, generateDialogue, narrateBiography } from '@/app/actions/character-write';
import { generateCharacterSheetData } from '@/app/character-generator/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Wand2, Dna, Swords, Shield, BrainCircuit, AlertCircle, RefreshCw, Calendar, Plus, Trash2, Sparkles, MessageSquareQuote, Volume2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
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
  birthYear: z.string().optional(),
  weaknesses: z.string().optional(),
});
type FormValues = z.infer<typeof FormSchema>;

const TimelineEventSchema = z.object({
    id: z.string(),
    date: z.string().min(1, 'Date is required'),
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
});

const TimelineFormSchema = z.object({
    timeline: z.array(TimelineEventSchema),
});
type TimelineFormValues = z.infer<typeof TimelineFormSchema>;


export function EditDetailsTab({ character: initialCharacter }: { character: Character }) {
    const { toast } = useToast();
    const router = useRouter();
    const [character, setCharacter] = useState(initialCharacter);
    const [isUpdating, startUpdateTransition] = useTransition();
    const [isRegenerating, startRegenerateTransition] = useTransition();
    const [isSuggestingEvent, startSuggestEventTransition] = useTransition();
    const [isGeneratingDialogue, startDialogueTransition] = useTransition();
    const [isNarratingBio, startNarrationTransition] = useTransition();
    const [dialogueLines, setDialogueLines] = useState<string[]>([]);
    const [biographyAudioUrl, setBiographyAudioUrl] = useState<string | null>(null);
    
    useEffect(() => {
        setCharacter(initialCharacter);
    }, [initialCharacter]);


    const form = useForm<FormValues>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            name: character.core.name,
            archetype: character.core.archetype || '',
            equipment: character.core.equipment || [],
            biography: character.core.biography,
            alignment: character.core.alignment || 'True Neutral',
            physicalDescription: character.core.physicalDescription || character.generation?.originalPrompt,
            birthYear: character.core.birthYear || 'Year 1',
            weaknesses: character.core.weaknesses || '',
        },
    });

    const timelineForm = useForm<TimelineFormValues>({
        resolver: zodResolver(TimelineFormSchema),
        defaultValues: {
            timeline: character.core.timeline || [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: timelineForm.control,
        name: 'timeline',
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

    const handleSaveTimeline = (data: TimelineFormValues) => {
        startUpdateTransition(async () => {
            const result = await updateCharacterTimeline(character.id, data.timeline);
            toast({
                title: result.success ? 'Success!' : 'Update Failed',
                description: result.message,
                variant: result.success ? 'default' : 'destructive',
            });
            if (result.success) {
                timelineForm.reset(data); // Reset dirty state
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
                const result = await generateCharacterSheetData({ 
                    description: originalPrompt, 
                    targetLanguage: 'English',
                    engineConfig: {
                        engineId: 'gemini',
                        modelId: 'gemini-1.5-flash-latest'
                    }
                });

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

    const handleSuggestEvent = () => {
        startSuggestEventTransition(async () => {
            const result = await suggestNextTimelineEvent(character.id);
            if (result.success && result.data) {
                append(result.data);
                toast({ title: 'Event Suggested!', description: 'A new event has been added to your timeline.' });
            } else {
                toast({ variant: 'destructive', title: 'Suggestion Failed', description: result.message });
            }
        });
    };

    const handleGenerateDialogue = () => {
        startDialogueTransition(async () => {
            const result = await generateDialogue(character.id);
            if (result.success && result.dialogueLines) {
                setDialogueLines(result.dialogueLines);
                toast({ title: 'Dialogue Generated!', description: 'Characteristic phrases for your character have been created.' });
            } else {
                toast({ variant: 'destructive', title: 'Dialogue Failed', description: result.message });
            }
        });
    };

    const handleNarrateBio = () => {
        startNarrationTransition(async () => {
            const result = await narrateBiography(character.id);
            if (result.success && result.audioUrl) {
                setBiographyAudioUrl(result.audioUrl);
                toast({ title: 'Narration Complete!', description: 'The character\'s biography is ready to be heard.' });
            } else {
                toast({ variant: 'destructive', title: 'Narration Failed', description: result.message });
            }
        })
    }


    const addNewEvent = () => {
        append({ id: uuidv4(), date: '', title: '', description: '' });
    }

    return (
        <div className="space-y-6">
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
                                <Label htmlFor="birthYear">Birth Year / Era</Label>
                                <Input id="birthYear" {...form.register('birthYear')} placeholder="e.g., 1995, Year of the Dragon" />
                            </div>
                             <div className="space-y-2 col-span-full">
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
                             <div className="space-y-2 col-span-full">
                                <Label htmlFor="weaknesses">Weaknesses & Vices (comma-separated)</Label>
                                <Input id="weaknesses" {...form.register('weaknesses')} placeholder="e.g., Fear of heights, Avarice, Sunlight" />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="physicalDescription">Physical Description (for Image Generation)</Label>
                            <Textarea id="physicalDescription" {...form.register('physicalDescription')} className="min-h-[150px] w-full" />
                        </div>
                    
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="biography">Biography</Label>
                                <div className="flex items-center gap-2">
                                    <Button type="button" variant="outline" size="sm" onClick={handleNarrateBio} disabled={isNarratingBio || !character.core.biography}>
                                        {isNarratingBio ? <Loader2 className="mr-2 animate-spin" /> : <Volume2 className="mr-2 text-primary" />}
                                        Narrate
                                    </Button>
                                    <Button type="button" variant="outline" size="sm" onClick={handleRegenerateBio} disabled={isRegenerating}>
                                        {isRegenerating ? <Loader2 className="mr-2 animate-spin" /> : <Wand2 className="mr-2" />}
                                        Regenerate
                                    </Button>
                                </div>
                            </div>
                             {biographyAudioUrl && (
                                <audio controls src={biographyAudioUrl} className="w-full mt-2">
                                    Your browser does not support the audio element.
                                </audio>
                            )}
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
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Character Voice</CardTitle>
                    <CardDescription>
                        Generate characteristic dialogue lines to define your character's personality and voice.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {dialogueLines.length > 0 && (
                            <div className="space-y-2 rounded-lg border p-4 bg-muted/50">
                                {dialogueLines.map((line, index) => (
                                    <p key={index} className="italic text-muted-foreground">"{line}"</p>
                                ))}
                            </div>
                        )}
                         <Button onClick={handleGenerateDialogue} disabled={isGeneratingDialogue} variant="outline">
                            {isGeneratingDialogue ? <Loader2 className="mr-2 animate-spin" /> : <MessageSquareQuote className="mr-2 text-primary"/>}
                            Generate Catchphrases
                        </Button>
                    </div>
                </CardContent>
            </Card>


            <Card>
                <CardHeader>
                    <CardTitle>Character Timeline & Backgrounds</CardTitle>
                    <CardDescription>
                        Map out key events, allies, resources, and influences. This adds depth for story generation.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={timelineForm.handleSubmit(handleSaveTimeline)} className="space-y-6">
                        <div className="space-y-4">
                            {fields.length > 0 ? (
                                fields.map((field, index) => (
                                    <Card key={field.id} className="p-4 bg-muted/50">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor={`timeline.${index}.date`}>Date / Age</Label>
                                                <Input
                                                    id={`timeline.${index}.date`}
                                                    {...timelineForm.register(`timeline.${index}.date`)}
                                                    placeholder="e.g., Age 25"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor={`timeline.${index}.title`}>Event Title</Label>
                                                <Input
                                                    id={`timeline.${index}.title`}
                                                    {...timelineForm.register(`timeline.${index}.title`)}
                                                    placeholder="The Coronation"
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-4 space-y-2">
                                            <Label htmlFor={`timeline.${index}.description`}>Description</Label>
                                            <Textarea
                                                id={`timeline.${index}.description`}
                                                {...timelineForm.register(`timeline.${index}.description`)}
                                                placeholder="Describe what happened..."
                                            />
                                        </div>
                                        <div className="mt-4 flex justify-end">
                                            <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)}>
                                                <Trash2 className="mr-2 h-4 w-4"/> Remove Event
                                            </Button>
                                        </div>
                                    </Card>
                                ))
                            ) : (
                                <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                                    <p>No timeline events added yet. Add one manually or let the AI suggest one.</p>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t">
                             <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={addNewEvent} disabled={isUpdating}>
                                    <Plus className="mr-2" /> Add Manually
                                </Button>
                                <Button type="button" variant="outline" onClick={handleSuggestEvent} disabled={isSuggestingEvent}>
                                    {isSuggestingEvent ? <Loader2 className="mr-2 animate-spin" /> : <Sparkles className="mr-2 text-yellow-400"/>}
                                    Suggest Event
                                </Button>
                            </div>
                            <Button type="submit" disabled={isUpdating || !timelineForm.formState.isDirty}>
                                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Timeline
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
