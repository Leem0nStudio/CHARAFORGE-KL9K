
'use client';

import { useState, useTransition } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Loader2, PlusCircle, Trash2, SlidersHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getModels } from '@/app/actions/ai-models';
import type { AiModel } from '@/types/ai-model';
import { useEffect } from 'react';
import { z } from 'zod';
import { createMixedModel } from './actions';

const ModelToMixSchema = z.object({
  modelId: z.string().min(1, 'Please select a model.'),
  weight: z.number().min(0).max(1),
});

const MixerFormSchema = z.object({
  name: z.string().min(3, 'New model name is required.'),
  baseModel: z.string().min(1, 'A base model type is required (e.g., SDXL 1.0).'),
  modelsToMix: z.array(ModelToMixSchema).min(2, 'You must select at least two models to mix.'),
}).refine(data => {
    const totalWeight = data.modelsToMix.reduce((sum, model) => sum + model.weight, 0);
    // Allow for small floating point inaccuracies
    return Math.abs(totalWeight - 1.0) < 0.01;
}, {
    message: 'The sum of all weights must be exactly 1.0.',
    path: ['modelsToMix'],
});

type MixerFormValues = z.infer<typeof MixerFormSchema>;

export default function ModelMixerPage() {
    const [availableModels, setAvailableModels] = useState<AiModel[]>([]);
    const [isLoadingModels, setIsLoadingModels] = useState(true);
    const [isProcessing, startTransition] = useTransition();
    const { toast } = useToast();

    useEffect(() => {
        const fetchModelsForMixer = async () => {
            setIsLoadingModels(true);
            const models = await getModels('model');
            // Filter for models that can actually be mixed (e.g., not Gemini)
            const mixableModels = models.filter(m => m.engine !== 'gemini' && m.engine !== 'openrouter');
            setAvailableModels(mixableModels);
            setIsLoadingModels(false);
        };
        fetchModelsForMixer();
    }, []);

    const form = useForm<MixerFormValues>({
        resolver: zodResolver(MixerFormSchema),
        defaultValues: {
            name: '',
            baseModel: 'SDXL 1.0',
            modelsToMix: [
                { modelId: '', weight: 0.5 },
                { modelId: '', weight: 0.5 },
            ],
        },
    });

    const { fields, append, remove, update } = useFieldArray({
        control: form.control,
        name: "modelsToMix",
    });

    const watchModelsToMix = form.watch('modelsToMix');

    const handleSliderChange = (index: number, newWeight: number) => {
        const otherModelsCount = fields.length - 1;
        if (otherModelsCount <= 0) {
            update(index, { ...fields[index], weight: 1.0 });
            return;
        }

        const remainingWeight = 1.0 - newWeight;
        const weightPerOther = remainingWeight / otherModelsCount;

        fields.forEach((_, i) => {
            if (i === index) {
                update(i, { ...fields[i], weight: newWeight });
            } else {
                update(i, { ...fields[i], weight: weightPerOther });
            }
        });
    };
    
    const onSubmit = (data: MixerFormValues) => {
        startTransition(async () => {
            const result = await createMixedModel(data);
            if(result.success) {
                toast({ title: 'Mix Job Queued!', description: result.message });
                form.reset();
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            }
        })
    }

    const totalWeight = watchModelsToMix.reduce((sum, m) => sum + (m.weight || 0), 0);

    return (
        <AdminPageLayout title="Model Mixer" actions={<div />}>
            <Card>
                <CardHeader>
                    <CardTitle>Create a New Merged Model</CardTitle>
                    <CardDescription>Select two or more base models and define their weights to create a unique new model file.</CardDescription>
                </CardHeader>
                <CardContent>
                   <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
                        <div className="space-y-2">
                           <Label htmlFor="name">New Model Name</Label>
                           <Input id="name" {...form.register('name')} placeholder="e.g., My Awesome Anime Mix" />
                           {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
                       </div>
                       <div className="space-y-2">
                           <Label htmlFor="baseModel">Base Model Type</Label>
                           <Input id="baseModel" {...form.register('baseModel')} placeholder="e.g., SDXL 1.0" />
                           <p className="text-xs text-muted-foreground">This helps match LoRAs in the future.</p>
                           {form.formState.errors.baseModel && <p className="text-sm text-destructive">{form.formState.errors.baseModel.message}</p>}
                       </div>

                       <div className="space-y-4">
                            <Label>Models to Mix</Label>
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                                    <div className="flex-grow space-y-4">
                                        <Select
                                            onValueChange={(value) => form.setValue(`modelsToMix.${index}.modelId`, value)}
                                            defaultValue={field.modelId}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a model..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {isLoadingModels ? (
                                                    <SelectItem value="loading" disabled>Loading models...</SelectItem>
                                                ) : (
                                                    availableModels.map(m => (
                                                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>

                                        <div className="flex items-center gap-4">
                                            <Slider
                                                value={[field.weight]}
                                                onValueChange={(value) => handleSliderChange(index, value[0])}
                                                max={1}
                                                step={0.05}
                                            />
                                            <span className="font-mono text-sm w-16 text-center">{(field.weight * 100).toFixed(0)}%</span>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => remove(index)}
                                        disabled={fields.length <= 2}
                                    >
                                        <Trash2 />
                                    </Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={() => append({ modelId: '', weight: 0 })}>
                                <PlusCircle className="mr-2"/> Add Model
                            </Button>
                            {form.formState.errors.modelsToMix && <p className="text-sm text-destructive">{form.formState.errors.modelsToMix.message}</p>}
                            <div className="p-2 text-center text-sm font-semibold border rounded-md">
                                Total Weight: <span className={Math.abs(totalWeight - 1.0) > 0.01 ? 'text-destructive' : 'text-green-500'}>{totalWeight.toFixed(2)} / 1.00</span>
                            </div>
                       </div>
                       
                       <Button type="submit" disabled={isProcessing}>
                           {isProcessing ? <Loader2 className="animate-spin mr-2"/> : <SlidersHorizontal className="mr-2"/>}
                           Queue Mix Job
                       </Button>
                   </form>
                </CardContent>
            </Card>
        </AdminPageLayout>
    );
}
