
'use client';

import { useState, useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { addAiModelFromCivitai, deleteModel, upsertModel } from '@/app/actions/ai-models';
import { UpsertModelSchema, type AiModel, type UpsertAiModel } from '@/types/ai-model';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, PlusCircle, Trash2, Pencil } from 'lucide-react';


function AddModelDialog({ type, isOpen, setIsOpen }: { type: 'model' | 'lora', isOpen: boolean, setIsOpen: (isOpen: boolean) => void }) {
    const [isProcessing, startTransition] = useTransition();
    const { toast } = useToast();

    const handleSubmit = () => {
        const civitaiId = (document.getElementById('civitaiModelId') as HTMLInputElement)?.value;
        if (!civitaiId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Civitai Model ID is required.'});
            return;
        }

        startTransition(async () => {
            const result = await addAiModelFromCivitai(type, civitaiId);
            if (result.success) {
                toast({ title: 'Success', description: result.message });
                setIsOpen(false);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.error || result.message });
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New {type === 'model' ? 'Base Model' : 'LoRA'}</DialogTitle>
                        <DialogDescription>
                            Enter the Civitai model ID. Metadata will be fetched automatically.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <Label htmlFor="civitaiModelId">Civitai Model ID</Label>
                        <Input id="civitaiModelId" placeholder="e.g., 9251" />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={isProcessing}>
                            {isProcessing && <Loader2 className="animate-spin mr-2"/>}
                            Add Model
                        </Button>
                    </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function EditModelDialog({ model, isOpen, setIsOpen }: { model: AiModel, isOpen: boolean, setIsOpen: (isOpen: boolean) => void }) {
    const [isProcessing, startTransition] = useTransition();
    const { toast } = useToast();
    const form = useForm<UpsertAiModel>({
        resolver: zodResolver(UpsertModelSchema),
        defaultValues: { ...model },
    });

    const onSubmit = (values: UpsertAiModel) => {
        startTransition(async () => {
            const result = await upsertModel({ ...values, id: model.id });
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

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <DialogHeader>
                        <DialogTitle>Edit: {model.name}</DialogTitle>
                        <DialogDescription>
                            Update the model's configuration.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input {...form.register('name')} />
                        </div>
                         <div className="space-y-2">
                            <Label>Execution Engine</Label>
                            <Controller
                                control={form.control}
                                name="engine"
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="gemini">Gemini</SelectItem>
                                            <SelectItem value="huggingface">Hugging Face / Gradio</SelectItem>
                                            <SelectItem value="openrouter">OpenRouter</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                        <div className="space-y-2 col-span-2">
                            <Label>Execution ID</Label>
                            <Input {...form.register('hf_id')} placeholder="e.g., stabilityai/stable-diffusion-xl-base-1.0 or openai/dall-e-3" />
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-between">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button type="button" variant="destructive" disabled={isProcessing}>
                                    <Trash2 className="mr-2"/> Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle></AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete} disabled={isProcessing}>
                                        {isProcessing ? <Loader2 className="animate-spin"/> : 'Continue'}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <div className="flex gap-2">
                            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isProcessing}>
                                {isProcessing && <Loader2 className="animate-spin mr-2"/>}
                                Save Changes
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export function ModelForm({ model, isEditing }: { model?: AiModel, isEditing?: boolean }) {
    const [dialogState, setDialogState] = useState<{ type: 'model' | 'lora' | null, isOpen: boolean }>({ type: null, isOpen: false });

    if (isEditing && model) {
        return (
            <>
                <Button variant="outline" size="sm" className="w-full" onClick={() => setDialogState({ type: model.type, isOpen: true })}>
                    <Pencil className="mr-2 h-3 w-3" /> Edit
                </Button>
                 <EditModelDialog model={model} isOpen={dialogState.isOpen} setIsOpen={(isOpen) => setDialogState({ type: model.type, isOpen })} />
            </>
        )
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2"/> Add New...
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setDialogState({ type: 'model', isOpen: true })}>Add Base Model</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDialogState({ type: 'lora', isOpen: true })}>Add LoRA</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            
            {dialogState.type && (
                <AddModelDialog 
                    type={dialogState.type}
                    isOpen={dialogState.isOpen}
                    setIsOpen={(isOpen) => setDialogState({ type: null, isOpen })}
                />
            )}
        </>
    );
}
