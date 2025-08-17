

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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, PlusCircle, Trash2, Pencil } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from '../ui/textarea';


function AddOrEditModelDialog({ model, isOpen, setIsOpen }: { model?: AiModel, isOpen: boolean, setIsOpen: (isOpen: boolean) => void }) {
    const [isProcessing, startTransition] = useTransition();
    const { toast } = useToast();
    const isEditing = !!model;

    const form = useForm<UpsertAiModel>({
        resolver: zodResolver(UpsertModelSchema),
        defaultValues: model ? { ...model, triggerWords: model.triggerWords?.join(', ') } : {
            name: '',
            type: 'lora',
            engine: 'huggingface',
            hf_id: '',
            civitaiModelId: '',
            versionId: '',
            triggerWords: '',
            vertexAiAlias: '',
        },
    });

    const onSubmit = (values: UpsertAiModel) => {
        startTransition(async () => {
            const result = await upsertModel({ ...values, id: model?.id });
            if (result.success) {
                toast({ title: 'Success', description: result.message });
                setIsOpen(false);
                form.reset();
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            }
        });
    };
    
    const handleDelete = () => {
        if (!model) return;
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
    
    const handleCivitaiImport = () => {
        const civitaiId = form.getValues('civitaiModelId');
        if (!civitaiId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Civitai Model ID is required.'});
            return;
        }

        startTransition(async () => {
            const result = await addAiModelFromCivitai(form.getValues('type'), civitaiId);
            if (result.success) {
                toast({ title: 'Success', description: result.message });
                setIsOpen(false);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.error || result.message });
            }
        });
    }

    const watchEngine = form.watch('engine');

    const executionIdLabel = watchEngine === 'vertexai' ? 'Vertex AI Endpoint ID' : 'Execution ID (e.g. Hugging Face ID)';

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-2xl">
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <DialogHeader>
                        <DialogTitle>{isEditing ? `Edit: ${model.name}` : 'Add New AI Model'}</DialogTitle>
                        <DialogDescription>
                            {isEditing ? "Update the model's configuration." : "Add a new model or LoRA from Civitai or manually."}
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="manual" className="w-full mt-4">
                        {!isEditing && (
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="manual">Add Manually</TabsTrigger>
                                <TabsTrigger value="civitai">Import from Civitai</TabsTrigger>
                            </TabsList>
                        )}
                        
                        <TabsContent value="manual">
                            <div className="py-4 grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <Label>Name</Label>
                                    <Input {...form.register('name')} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                     <Controller
                                        control={form.control}
                                        name="type"
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="model">Base Model</SelectItem>
                                                    <SelectItem value="lora">LoRA</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Execution Engine</Label>
                                    <Controller
                                        control={form.control}
                                        name="engine"
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="vertexai">Vertex AI</SelectItem>
                                                    <SelectItem value="gemini">Gemini</SelectItem>
                                                    <SelectItem value="huggingface">Hugging Face / Gradio</SelectItem>
                                                    <SelectItem value="openrouter">OpenRouter</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label>{executionIdLabel}</Label>
                                    <Input {...form.register('hf_id')} placeholder={watchEngine === 'vertexai' ? 'e.g., 1234567890123456789' : "e.g., stabilityai/sdxl"} />
                                </div>

                                {watchEngine === 'vertexai' && form.watch('type') === 'lora' && (
                                     <div className="space-y-2 col-span-2">
                                        <Label>Vertex AI Alias (Opcional)</Label>
                                        <Input {...form.register('vertexAiAlias')} placeholder="e.g., my-anime-lora" />
                                        <p className="text-xs text-muted-foreground">El alias exacto configurado en tu Endpoint de Vertex AI para este LoRA.</p>
                                    </div>
                                )}

                                {form.watch('type') === 'lora' && (
                                    <div className="space-y-2 col-span-2">
                                        <Label>Trigger Words (comma-separated)</Label>
                                         <Controller
                                            name="triggerWords"
                                            control={form.control}
                                            render={({ field }) => (
                                                <Textarea
                                                    {...field}
                                                    placeholder="e.g., word1, word2, style"
                                                />
                                            )}
                                        />
                                    </div>
                                )}
                                {isEditing && (
                                    <div className="space-y-2 col-span-2">
                                        <Label>Cover Image</Label>
                                        <Input name="coverImage" type="file" accept="image/png, image/jpeg, image/webp" />
                                        <p className="text-xs text-muted-foreground">Upload a new image to replace the existing one.</p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                        
                        {!isEditing && (
                             <TabsContent value="civitai">
                                <div className="py-4 space-y-4">
                                    <div className="space-y-2">
                                        <Label>Model Type</Label>
                                          <Controller
                                            control={form.control}
                                            name="type"
                                            render={({ field }) => (
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="model">Base Model</SelectItem>
                                                        <SelectItem value="lora">LoRA</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="civitaiModelId">Civitai Model ID</Label>
                                        <Input {...form.register('civitaiModelId')} id="civitaiModelId" placeholder="e.g., 9251" />
                                    </div>
                                     <Button type="button" onClick={handleCivitaiImport} disabled={isProcessing} className="w-full">
                                        {isProcessing && <Loader2 className="animate-spin mr-2"/>}
                                        Fetch & Add Model
                                    </Button>
                                </div>
                             </TabsContent>
                        )}
                    </Tabs>

                    <DialogFooter className="sm:justify-between mt-4">
                        {isEditing && (
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
                        )}
                        {!isEditing && <div></div>} 
                        <div className="flex gap-2">
                            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isProcessing}>
                                {isProcessing && <Loader2 className="animate-spin mr-2"/>}
                                {isEditing ? 'Save Changes' : 'Add Manually'}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export function ModelForm({ model, isEditing }: { model?: AiModel, isEditing?: boolean }) {
    const [isOpen, setIsOpen] = useState(false);

    if (isEditing && model) {
        return (
            <>
                <Button variant="outline" size="sm" className="w-full" onClick={() => setIsOpen(true)}>
                    <Pencil className="mr-2 h-3 w-3" /> Edit
                </Button>
                 <AddOrEditModelDialog model={model} isOpen={isOpen} setIsOpen={setIsOpen} />
            </>
        )
    }

    return (
        <>
            <Button onClick={() => setIsOpen(true)}>
                <PlusCircle className="mr-2"/> Add New...
            </Button>
            <AddOrEditModelDialog isOpen={isOpen} setIsOpen={setIsOpen} />
        </>
    );
}
