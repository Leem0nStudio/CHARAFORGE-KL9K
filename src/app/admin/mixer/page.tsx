'use client';

import { useState, useTransition } from 'react';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Wand2, Dices } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateArchitectPrompt } from './actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function PromptArchitectStudioPage() {
    const [isProcessing, startTransition] = useTransition();
    const { toast } = useToast();
    
    const [prompt, setPrompt] = useState('');
    const [seed, setSeed] = useState<number | null>(null);
    const [focusModule, setFocusModule] = useState('integrated');

    const handleGenerate = (seedOverride?: number) => {
        startTransition(async () => {
            const finalSeed = seedOverride ?? seed ?? undefined;
            const result = await generateArchitectPrompt({ 
                focusModule: focusModule as any, 
                seed: finalSeed 
            });

            if(result.success && result.data) {
                setPrompt(result.data.prompt);
                setSeed(result.data.seed);
                toast({ title: 'Prompt Generated!', description: `Generated with seed: ${result.data.seed}`});
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            }
        });
    };

    return (
        <AdminPageLayout title="Prompt Architect Studio" actions={<div />}>
            <Card>
                <CardHeader>
                    <CardTitle>Narrative Prompt Composer</CardTitle>
                    <CardDescription>
                        Use the intelligent composition engine to generate high-quality, narrative prompts. 
                        Select a focus module and let the architect build the story.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <label className="text-sm font-medium">Focus Module</label>
                                <Select value={focusModule} onValueChange={setFocusModule}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a focus..."/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="character_focus">Character Focus</SelectItem>
                                        <SelectItem value="scene_focus">Scene Focus</SelectItem>
                                        <SelectItem value="action_focus">Action Focus</SelectItem>
                                        <SelectItem value="integrated">Integrated</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                           <div className="flex-1">
                                <label className="text-sm font-medium">Seed (Optional)</label>
                                <Input 
                                    type="number"
                                    value={seed ?? ''}
                                    onChange={(e) => setSeed(e.target.value ? Number(e.target.value) : null)}
                                    placeholder="Leave empty for random"
                                />
                           </div>
                        </div>

                        <div className="flex gap-2">
                             <Button onClick={() => handleGenerate()} disabled={isProcessing} className="flex-1">
                                {isProcessing ? <Loader2 className="animate-spin mr-2"/> : <Wand2 className="mr-2"/>}
                                {seed ? 'Generate with Seed' : 'Generate'}
                            </Button>
                             <Button onClick={() => handleGenerate(Math.floor(Math.random() * 1e9))} variant="secondary" disabled={isProcessing}>
                                <Dices className="mr-2"/>
                                Random Seed
                            </Button>
                        </div>
                       
                        <div>
                             <label className="text-sm font-medium">Generated Prompt</label>
                             <Textarea 
                                value={prompt}
                                readOnly
                                rows={8}
                                className="w-full bg-muted/50 font-mono text-sm"
                                placeholder="Your generated narrative prompt will appear here..."
                             />
                        </div>
                   </div>
                </CardContent>
            </Card>
        </AdminPageLayout>
    );
}
