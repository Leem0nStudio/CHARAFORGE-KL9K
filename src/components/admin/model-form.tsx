'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { addModel, deleteModel, updateModelHfId } from '@/app/actions/ai-models';
import { suggestHfModel } from '@/ai/flows/hf-model-suggestion/flow';
import type { AiModel } from '@/types/ai-model';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, PlusCircle, Trash2, Wand2 } from 'lucide-react';

const FormSchema = z.object({
    civitaiModelId: z.string().min(1, 'Civitai Model ID is required.'),
    type: z.enum(['model', 'lora']),
    hf_id: z.string().optional(),
});
type FormValues = z.infer<typeof FormSchema>;

interface ModelFormProps {
    model?: AiModel;
    triggerType: 'button' | 'link';
}

export function ModelForm({ model, triggerType }: ModelFormProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isProcessing, startTransition] = useTransition();
    const [isSuggesting, startSuggestionTransition] = useTransition();
    const { toast } = useToast();

    const form = useForm<FormValues>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            civitaiModelId: model?.civitaiModelId || '',
            type: model?.type || 'model',
            hf_id: model?.hf_id || '',
        },
    });
    
    const handleSuggestModel = () => {
        const modelName = model?.name;
        if (!modelName) {
            toast({ variant: 'destructive', title: 'Error', description: 'Model must be saved once to get a name before suggesting an HF model.' });
            return;
        }
        
        startSuggestionTransition(async () => {
             try {
                const result = await suggestHfModel({ modelName });
                if (result.suggestedHfId) {
                    form.setValue('hf_id', result.suggestedHfId);
                    toast({ title: 'Suggestion Received!', description: `AI suggested: ${result.suggestedHfId}` });
                } else {
                    toast({ title: 'No Suggestion', description: 'The AI could not find a suitable model.' });
                }
             } catch(error) {
                 const message = error instanceof Error ? error.message : 'An unknown error occurred.';
                 toast({ variant: 'destructive', title: 'Suggestion Failed', description: message });
             }
        });
    }

    const onSubmit = (values: FormValues) => {
        startTransition(async () => {
            let result;
            if (model) {
                // Update existing model
                result = await updateModelHfId(model.id, values.hf_id || '');
            } else {
                // Add new model
                result = await addModel(values.civitaiModelId, values.type, values.hf_id);
            }
            
            if (result.success) {
                toast({ title: 'Success', description: result.message });
                setIsOpen(false);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            }
        });
    };
    
    const handleDelete = () => {
        if (!model?.id) return;
        startTransition(async () => {
            const result = await deleteModel(model.id);
            if (result.success) {
                toast({ title: 'Success', description: 'Model deleted.' });
                setIsOpen(false);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            }
        });
    };

    const Trigger = triggerType === 'button' ? (
        <Button>
            <PlusCircle className="mr-2"/> Add New Model
        </Button>
    ) : (
        <Button variant="link" size="sm" className="p-0 h-auto">Edit</Button>
    );
    
    const isBusy = isProcessing || isSuggesting;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{Trigger}</DialogTrigger>
            <DialogContent>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <DialogHeader>
                        <DialogTitle>{model ? `Edit: ${model.name}` : 'Add New AI Model'}</DialogTitle>
                        <DialogDescription>
                            Enter the Civitai model ID. Metadata like name and preview images will be fetched automatically.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="civitaiModelId">Civitai Model ID</Label>
                            <Input id="civitaiModelId" {...form.register('civitaiModelId')} placeholder="e.g., 4384" disabled={!!model}/>
                            {form.formState.errors.civitaiModelId && <p className="text-sm text-destructive">{form.formState.errors.civitaiModelId.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="hf_id">Hugging Face/Gradio ID (for Execution)</Label>
                            <div className="flex gap-2">
                                <Input id="hf_id" {...form.register('hf_id')} placeholder="e.g., stabilityai/stable-diffusion-xl-base-1.0" />
                                <Button type="button" variant="outline" onClick={handleSuggestModel} disabled={!model || isBusy}>
                                    {isSuggesting ? <Loader2 className="animate-spin" /> : <Wand2 />}
                                </Button>
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label>Type</Label>
                            <Select onValueChange={(value) => form.setValue('type', value as 'model' | 'lora')} defaultValue={form.getValues('type')} disabled={!!model}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="model">Base Model</SelectItem>
                                    <SelectItem value="lora">LoRA</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-between">
                         {model ? (
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button type="button" variant="destructive" disabled={isBusy}>
                                        <Trash2 className="mr-2"/> Delete
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>This will delete the model from your application. This cannot be undone.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDelete} disabled={isBusy}>
                                            {isBusy ? <Loader2 className="animate-spin"/> : 'Continue'}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                         ) : <div></div>}
                        <Button type="submit" disabled={isBusy}>
                            {isBusy && <Loader2 className="animate-spin mr-2"/>}
                            {model ? 'Save Changes' : 'Add Model'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
