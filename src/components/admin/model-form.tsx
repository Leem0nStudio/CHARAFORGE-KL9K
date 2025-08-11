
'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { addModel, deleteModel } from '@/app/actions/ai-models';
import type { AiModel } from '@/types/ai-model';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';

const FormSchema = z.object({
    hf_id: z.string().min(1, 'Hugging Face ID is required.'),
    type: z.enum(['model', 'lora']),
    triggerWords: z.string().optional(),
});
type FormValues = z.infer<typeof FormSchema>;

interface ModelFormProps {
    model?: AiModel;
    triggerType: 'button' | 'link';
}

export function ModelForm({ model, triggerType }: ModelFormProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const form = useForm<FormValues>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            hf_id: model?.hf_id || '',
            type: model?.type || 'model',
            triggerWords: model?.triggerWords?.join(', ') || '',
        },
    });

    const onSubmit = (values: FormValues) => {
        startTransition(async () => {
            const result = await addModel(values.hf_id, values.type, values.triggerWords?.split(',').map(s => s.trim()).filter(Boolean));
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

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{Trigger}</DialogTrigger>
            <DialogContent>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <DialogHeader>
                        <DialogTitle>{model ? 'Edit Model' : 'Add New AI Model'}</DialogTitle>
                        <DialogDescription>
                            Enter the Hugging Face identifier. Metadata like name and description will be fetched automatically.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="hf_id">Hugging Face ID</Label>
                            <Input id="hf_id" {...form.register('hf_id')} placeholder="e.g., stabilityai/stable-diffusion-xl-base-1.0" />
                            {form.formState.errors.hf_id && <p className="text-sm text-destructive">{form.formState.errors.hf_id.message}</p>}
                        </div>
                         <div className="space-y-2">
                            <Label>Type</Label>
                            <Select onValueChange={(value) => form.setValue('type', value as 'model' | 'lora')} defaultValue={form.getValues('type')}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="model">Base Model</SelectItem>
                                    <SelectItem value="lora">LoRA</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {form.watch('type') === 'lora' && (
                            <div className="space-y-2">
                                <Label htmlFor="triggerWords">Trigger Words (comma-separated)</Label>
                                <Input id="triggerWords" {...form.register('triggerWords')} placeholder="e.g., artwork, best quality"/>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="sm:justify-between">
                         {model ? (
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button type="button" variant="destructive" disabled={isPending}>
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
                                        <AlertDialogAction onClick={handleDelete} disabled={isPending}>
                                            {isPending ? <Loader2 className="animate-spin"/> : 'Continue'}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                         ) : <div></div>}
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="animate-spin mr-2"/>}
                            {model ? 'Save Changes' : 'Add Model'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
