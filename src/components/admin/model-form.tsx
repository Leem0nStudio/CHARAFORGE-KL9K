
'use client';

import { useState, useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { addAiModelFromSource, deleteModel, upsertModel } from '@/app/actions/ai-models';
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
    const [importSource, setImportSource] = useState<'civitai' | 'modelslab'>('civitai');

    const form = useForm<UpsertAiModel>({
        resolver: zodResolver(UpsertModelSchema),
        defaultValues: model ? { ...model, comfyWorkflow: model.comfyWorkflow ? JSON.stringify(model.comfyWorkflow, null, 2) : '', triggerWords: model.triggerWords?.join(', ') } : {
            name: '',
            type: 'lora',
            engine: 'huggingface',
            hf_id: '',
            civitaiModelId: '',
            modelslabModelId: '',
            versionId: '',
            baseModel: '',
            triggerWords: '',
            vertexAiAlias: '',
            apiUrl: '',
            comfyWorkflow: '',
        },
    });

    const onSubmit = (values: UpsertAiModel) => {
        startTransition(async () => {
            let finalValues = { ...values };
            if (values.engine === 'comfyui' && typeof values.comfyWorkflow === 'string' && values.comfyWorkflow.trim()) {
                try {
                    finalValues.comfyWorkflow = JSON.parse(values.comfyWorkflow);
                } catch (e) {
                    toast({ variant: 'destructive', title: 'Invalid JSON', description: 'The ComfyUI workflow is not valid JSON.' });
                    return;
                }
            } else if (values.engine !== 'comfyui') {
                 finalValues.comfyWorkflow = undefined;
            }

            const result = await upsertModel({ ...finalValues, id: model?.id });
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
    
    const handleSourceImport = () => {
        const sourceModelId = form.getValues('civitaiModelId'); // Using one field for both for simplicity
        if (!sourceModelId) {
            toast({ variant: 'destructive', title: 'Error', description: `A Model ID from ${importSource} is required.`});
            return;
        }

        startTransition(async () => {
            const result = await addAiModelFromSource(importSource, sourceModelId);
            if (result.success) {
                toast({ title: 'Success', description: result.message });
                setIsOpen(false);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.error || result.message });
            }
        });
    }

    const watchEngine = form.watch('engine');
    const watchType = form.watch('type');
    
    const getExecutionIdLabel = () => {
        switch(watchEngine) {
            case 'vertexai': return 'Vertex AI Endpoint ID';
            case 'comfyui': return 'Default Base Model Filename';
            case 'huggingface': return 'Hugging Face Model ID';
            case 'modelslab': return 'ModelsLab Model ID';
            default: return 'Execution ID';
        }
    }
     const getExecutionIdPlaceholder = () => {
        switch(watchEngine) {
            case 'vertexai': return 'e.g., 1234567890123456789';
            case 'comfyui': return 'e.g., v1-5-pruned-emaonly.safetensors';
            case 'huggingface': return 'e.g., stabilityai/sdxl';
            case 'modelslab': return 'e.g., 12345';
            default: return 'Enter ID';
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-2xl">
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <DialogHeader>
                        <DialogTitle>{isEditing ? `Edit: ${model.name}` : 'Add New AI Model'}</DialogTitle>
                        <DialogDescription>
                            {isEditing ? "Update the model's configuration." : "Add a new model or LoRA manually or by importing from a source."}
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="manual" className="w-full mt-4">
                        {!isEditing && (
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="manual">Add Manually</TabsTrigger>
                                <TabsTrigger value="import">Import from Source</TabsTrigger>
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
                                                    <SelectItem value="comfyui">ComfyUI / A1111</SelectItem>
                                                    <SelectItem value="vertexai">Vertex AI</SelectItem>
                                                    <SelectItem value="gemini">Gemini</SelectItem>
                                                    <SelectItem value="huggingface">Hugging Face</SelectItem>
                                                    <SelectItem value="modelslab">ModelsLab</SelectItem>
                                                    <SelectItem value="openrouter">OpenRouter</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>

                                {watchEngine === 'comfyui' && (
                                     <div className="space-y-2 col-span-2">
                                        <Label>ComfyUI Server URL</Label>
                                        <Input {...form.register('apiUrl')} placeholder="http://your-server-ip:8188/prompt" />
                                     </div>
                                )}
                                
                                <div className="space-y-2 col-span-2">
                                    <Label>{getExecutionIdLabel()}</Label>
                                    <Input {...form.register('hf_id')} placeholder={getExecutionIdPlaceholder()} />
                                </div>
                                
                                {(watchEngine === 'modelslab' || watchEngine === 'huggingface') && (
                                     <div className="space-y-2 col-span-2">
                                        <Label>Model Version ID</Label>
                                        <Input {...form.register('versionId')} placeholder="e.g., 45678 (for ModelsLab)" />
                                        <p className="text-xs text-muted-foreground">Required for some engines like ModelsLab to specify which version to use for generation.</p>
                                    </div>
                                )}


                                {watchType === 'model' && (
                                    <div className="space-y-2 col-span-2">
                                        <Label>Base Model Identifier</Label>
                                        <Input {...form.register('baseModel')} placeholder="e.g., SDXL 1.0, SD 1.5" />
                                        <p className="text-xs text-muted-foreground">The exact string used by sources to identify this base model (e.g., "SDXL 1.0"). Crucial for matching.</p>
                                    </div>
                                )}

                                {watchEngine === 'vertexai' && form.watch('type') === 'lora' && (
                                     <div className="space-y-2 col-span-2">
                                        <Label>Vertex AI LoRA Alias</Label>
                                        <Input {...form.register('vertexAiAlias')} placeholder="e.g., my-anime-lora" />
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

                                {watchEngine === 'comfyui' && (
                                     <div className="space-y-2 col-span-2">
                                        <Label>ComfyUI Workflow (JSON)</Label>
                                        <Controller
                                            name="comfyWorkflow"
                                            control={form.control}
                                            render={({ field }) => (
                                                <Textarea
                                                    {...field}
                                                    placeholder='Paste your ComfyUI API format workflow here...'
                                                    className="min-h-32 font-mono text-xs"
                                                />
                                            )}
                                        />
                                     </div>
                                )}
                            </div>
                        </TabsContent>
                        
                        {!isEditing && (
                             <TabsContent value="import">
                                <div className="py-4 space-y-4">
                                     <div className="space-y-2">
                                        <Label>Import Source</Label>
                                        <Select onValueChange={(value: 'civitai' | 'modelslab') => setImportSource(value)} defaultValue={importSource}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="civitai">Civitai</SelectItem>
                                                <SelectItem value="modelslab">ModelsLab</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="sourceModelId">Model ID from {importSource}</Label>
                                        <Input {...form.register('civitaiModelId')} id="sourceModelId" placeholder="e.g., 9251" />
                                    </div>
                                     <Button type="button" onClick={handleSourceImport} disabled={isProcessing} className="w-full">
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
