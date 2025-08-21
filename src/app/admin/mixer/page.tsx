
'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, SlidersHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { createMixedModel } from './actions';

const MixerFormSchema = z.object({
  name: z.string().min(3, 'A name for the final merged model is required.'),
  mergeScript: z.string().min(10, 'A merge plan script is required.'),
  hfRepo: z.string().optional(),
});

type MixerFormValues = z.infer<typeof MixerFormSchema>;

export default function ModelMixerPage() {
    const [isProcessing, startTransition] = useTransition();
    const { toast } = useToast();

    const form = useForm<MixerFormValues>({
        resolver: zodResolver(MixerFormSchema),
        defaultValues: {
            name: '',
            mergeScript: '',
            hfRepo: '',
        },
    });

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

    const exampleScript = `+MKF, https://civitai.com/models/135477/molkeun-furry-mix
+SXL, https://civitai.com/models/360745/sonicdiffusionxl
CM MKF + SXL 0.5 _TEMP_A

+ALP, https://civitai.com/models/471691/alphonse-white-datura-style-pony
CM _TEMP_A + ALP 0.7 MyFinalModel

PR MyFinalModel MyFinalPrunedModel`;

    return (
        <AdminPageLayout title="Universal Model Mixer" actions={<div />}>
            <Card>
                <CardHeader>
                    <CardTitle>Create a New Merged Model</CardTitle>
                    <CardDescription>
                        Define a complex merge using the Universal Model Merge Scripter syntax. 
                        This plan will be saved and can be executed by a backend process (e.g., on Kaggle).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                       <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                               <div className="space-y-2">
                                   <Label htmlFor="name">Final Model Name</Label>
                                   <Input id="name" {...form.register('name')} placeholder="e.g., MyAwesomeAnimeMixV3" />
                                   <p className="text-xs text-muted-foreground">The name of the final model file produced by the script.</p>
                                   {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
                               </div>
                                <div className="space-y-2">
                                   <Label htmlFor="hfRepo">Hugging Face Repo (Optional)</Label>
                                   <Input id="hfRepo" {...form.register('hfRepo')} placeholder="YourUsername/YourModelRepo" />
                                   <p className="text-xs text-muted-foreground">If provided, the script can upload the result here.</p>
                               </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mergeScript">Merge Plan Script</Label>
                                <Textarea 
                                    id="mergeScript" 
                                    {...form.register('mergeScript')} 
                                    placeholder={exampleScript}
                                    className="min-h-[250px] font-mono text-xs"
                                />
                                {form.formState.errors.mergeScript && <p className="text-sm text-destructive">{form.formState.errors.mergeScript.message}</p>}
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
