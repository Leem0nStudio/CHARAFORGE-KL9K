
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, PlusCircle, Trash2, Wand2 } from 'lucide-react';

const AddFormSchema = z.object({
    civitaiModelId: z.string().min(1, 'Civitai Model ID is required.'),
});
type AddFormValues = z.infer<typeof AddFormSchema>;

const EditFormSchema = z.object({
    hf_id: z.string().optional(),
});
type EditFormValues = z.infer<typeof EditFormSchema>;


interface ModelFormProps {
    model?: AiModel;
    triggerType: 'button' | 'link';
}

function AddModelForm({ setIsOpen }: { setIsOpen: (isOpen: boolean) => void }) {
    const [isProcessing, startTransition] = useTransition();
    const { toast } = useToast();
    const form = useForm<AddFormValues>({
        resolver: zodResolver(AddFormSchema),
        defaultValues: { civitaiModelId: '' },
    });

    const onSubmit = (values: AddFormValues) => {
        startTransition(async () => {
            const result = await addModel(values.civitaiModelId);
            if (result.success) {
                toast({ title: 'Success', description: result.message });
                setIsOpen(false);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            }
        });
    }

    return (
         <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
                <DialogTitle>Add New AI Model</DialogTitle>
                <DialogDescription>
                    Enter the Civitai model ID. Metadata, type, and a suggested base model will be fetched and configured automatically.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="civitaiModelId">Civitai Model ID</Label>
                    <Input id="civitaiModelId" {...form.register('civitaiModelId')} placeholder="e.g., 827184" />
                    {form.formState.errors.civitaiModelId && <p className="text-sm text-destructive">{form.formState.errors.civitaiModelId.message}</p>}
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isProcessing}>
                    {isProcessing && <Loader2 className="animate-spin mr-2"/>}
                    Add Model
                </Button>
            </DialogFooter>
        </form>
    )
}

function EditModelForm({ model, setIsOpen }: { model: AiModel, setIsOpen: (isOpen: boolean) => void }) {
    const [isProcessing, startTransition] = useTransition();
    const [isSuggesting, startSuggestionTransition] = useTransition();
    const { toast } = useToast();
    const form = useForm<EditFormValues>({
        resolver: zodResolver(EditFormSchema),
        defaultValues: { hf_id: model.hf_id || '' },
    });

    const handleSuggestModel = () => {
        startSuggestionTransition(async () => {
             try {
                const result = await suggestHfModel({ modelName: model.name });
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

    const onSubmit = (values: EditFormValues) => {
        startTransition(async () => {
            const result = await updateModelHfId(model.id, values.hf_id || '');
            if (result.success) {
                toast({ title: 'Success', description: result.message });
                setIsOpen(false);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            }
        });
    };
    
    const handleDelete = () => {
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
    
    const isBusy = isProcessing || isSuggesting;

    return (
        <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
                <DialogTitle>Edit: {model.name}</DialogTitle>
                <DialogDescription>
                    Update the execution model ID. Use the assistant to find a compatible base model on Hugging Face.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="hf_id">Hugging Face/Gradio ID (for Execution)</Label>
                    <div className="flex gap-2">
                        <Input id="hf_id" {...form.register('hf_id')} placeholder="e.g., stabilityai/stable-diffusion-xl-base-1.0" />
                        <Button type="button" variant="outline" onClick={handleSuggestModel} disabled={isBusy} title="Suggest Base Model">
                            {isSuggesting ? <Loader2 className="animate-spin" /> : <Wand2 />}
                        </Button>
                    </div>
                </div>
            </div>
            <DialogFooter className="sm:justify-between">
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
                <div className="flex gap-2">
                    <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={isBusy}>
                        {isBusy && <Loader2 className="animate-spin mr-2"/>}
                        Save Changes
                    </Button>
                </div>
            </DialogFooter>
        </form>
    )
}

export function ModelForm({ model, triggerType }: ModelFormProps) {
    const [isOpen, setIsOpen] = useState(false);

    const Trigger = triggerType === 'button' ? (
        <Button>
            <PlusCircle className="mr-2"/> Add New Model
        </Button>
    ) : (
        <Button variant="link" size="sm" className="p-0 h-auto">Edit</Button>
    );

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{Trigger}</DialogTrigger>
            <DialogContent>
                {model ? <EditModelForm model={model} setIsOpen={setIsOpen} /> : <AddModelForm setIsOpen={setIsOpen} />}
            </DialogContent>
        </Dialog>
    );
}
