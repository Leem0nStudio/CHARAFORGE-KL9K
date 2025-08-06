
'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wand2, Loader2, ArrowRight } from 'lucide-react';
import { BackButton } from '@/components/back-button';

// This schema would be dynamically generated from a DataPack's schema.json in a real implementation
const promptWizardSchema = z.object({
  character_type: z.string().min(1, 'Please select a character type.'),
  art_style: z.string().min(1, 'Please select an art style.'),
  hair_style: z.string().min(1, 'Please select a hair style.'),
  outfit: z.string().min(1, 'Please select an outfit.'),
  location: z.string().optional(),
});

type PromptWizardFormValues = z.infer<typeof promptWizardSchema>;

function PromptWizardComponent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const packId = searchParams.get('pack');

    // In a real implementation, you would fetch the datapack schema based on packId
    // and dynamically build the form and schema. For now, we use a static example.
    
    const { register, handleSubmit, control, formState: { errors } } = useForm<PromptWizardFormValues>({
        resolver: zodResolver(promptWizardSchema),
    });

    const onSubmit = (data: PromptWizardFormValues) => {
        // Construct the prompt string from form data
        const promptParts = [
            `A ${data.character_type}`,
            `in a ${data.art_style} style`,
            `with ${data.hair_style} hair`,
            `wearing a ${data.outfit}`,
            data.location ? `in a ${data.location}` : '',
        ];
        const finalPrompt = promptParts.filter(Boolean).join(', ');
        
        // Redirect to character generator with the prompt in the URL
        router.push(`/character-generator?prompt=${encodeURIComponent(finalPrompt)}`);
    };

    return (
      <div className="container py-8">
        <div className="mx-auto grid w-full max-w-2xl gap-2 mb-8">
            <div className="flex items-center gap-4">
                <BackButton />
                <div>
                    <h1 className="text-3xl font-semibold font-headline tracking-wider">Prompt Wizard</h1>
                    <p className="text-muted-foreground">
                       Fill out the fields to construct a detailed character prompt.
                       <span className="block text-xs">Using DataPack: <span className="font-bold">{packId || 'Example Pack'}</span></span>
                    </p>
                </div>
            </div>
        </div>

        <Card className="max-w-2xl mx-auto">
             <CardHeader>
                <CardTitle>Character Details</CardTitle>
                <CardDescription>Each selection will add more detail to your final prompt.</CardDescription>
            </CardHeader>
            <CardContent>
                 <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Example of a dynamic field */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>Character Type</Label>
                             <Controller
                                name="character_type"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger><SelectValue placeholder="Select a type..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="space pirate">Space Pirate</SelectItem>
                                            <SelectItem value="fantasy knight">Fantasy Knight</SelectItem>
                                            <SelectItem value="cyberpunk hacker">Cyberpunk Hacker</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.character_type && <p className="text-sm text-destructive mt-1">{errors.character_type.message}</p>}
                        </div>
                         <div>
                            <Label>Art Style</Label>
                             <Controller
                                name="art_style"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger><SelectValue placeholder="Select a style..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="photorealistic">Photorealistic</SelectItem>
                                            <SelectItem value="anime">Anime</SelectItem>
                                            <SelectItem value="pixel art">Pixel Art</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                             {errors.art_style && <p className="text-sm text-destructive mt-1">{errors.art_style.message}</p>}
                        </div>
                         <div>
                            <Label>Hair Style</Label>
                             <Controller
                                name="hair_style"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger><SelectValue placeholder="Select hair..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cyber-mullet">Cyber-Mullet</SelectItem>
                                            <SelectItem value="glowing dreadlocks">Glowing Dreadlocks</SelectItem>
                                            <SelectItem value="spiky anime hair">Spiky Anime Hair</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.hair_style && <p className="text-sm text-destructive mt-1">{errors.hair_style.message}</p>}
                        </div>
                         <div>
                            <Label>Outfit</Label>
                             <Controller
                                name="outfit"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger><SelectValue placeholder="Select an outfit..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="long trench coat">Long Trench Coat</SelectItem>
                                            <SelectItem value="glowing power armor">Glowing Power Armor</SelectItem>
                                            <SelectItem value="leather jacket with patches">Leather Jacket with Patches</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.outfit && <p className="text-sm text-destructive mt-1">{errors.outfit.message}</p>}
                        </div>
                         <div className="md:col-span-2">
                             <Label>Location (Optional)</Label>
                            <Input {...register('location')} placeholder="e.g., a neon-lit alley" />
                        </div>
                    </div>
                    
                    <Button type="submit" size="lg" className="w-full">
                        Generate Prompt <ArrowRight className="ml-2" />
                    </Button>
                </form>
            </CardContent>
        </Card>
      </div>
    );
}

// Wrap the component in Suspense as it uses useSearchParams
export default function PromptWizardPage() {
    return (
        <Suspense fallback={
             <div className="flex items-center justify-center h-screen w-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <PromptWizardComponent />
        </Suspense>
    );
}
