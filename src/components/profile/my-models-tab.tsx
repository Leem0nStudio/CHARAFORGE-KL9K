
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { getModelsForUser, upsertUserAiModel, deleteModel } from '@/app/actions/ai-models';
import type { AiModel, UpsertAiModel } from '@/types/ai-model';
import { UpsertModelSchema } from '@/types/ai-model';
import { 
    Button,
    Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter,
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
    Input,
    Label,
    Textarea,
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
    Badge
} from '@/components/ui';
import { Loader2, PlusCircle, Pencil, Trash2, Bot } from 'lucide-react';
import { MediaDisplay } from '../media-display';
import { useAuth } from '@/hooks/use-auth';

function ModelEditDialog({ 
    model, 
    onSuccess,
    trigger
}: { 
    model?: AiModel, 
    onSuccess: () => void,
    trigger: React.ReactNode
}) {
    const [isOpen, setIsOpen] = useState(false);
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
            triggerWords: '',
        },
    });

    useEffect(() => {
        if (isOpen) {
            form.reset(model ? { ...model, triggerWords: model.triggerWords?.join(', ') } : {
                name: '', type: 'lora', engine: 'huggingface', hf_id: '', triggerWords: ''
            });
        }
    }, [isOpen, model, form]);
    
    // This is now the handler for the form's submit event.
    const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault(); // Prevent default form submission
        
        // Manually trigger validation
        form.handleSubmit(
            (data) => { // onSuccess
                startTransition(async () => {
                    // Create FormData and append all fields
                    const formData = new FormData();
                    if (model?.id) {
                        formData.append('id', model.id);
                    }
                    formData.append('name', data.name);
                    formData.append('type', data.type);
                    formData.append('hf_id', data.hf_id);
                    if (data.triggerWords) {
                        formData.append('triggerWords', Array.isArray(data.triggerWords) ? data.triggerWords.join(',') : data.triggerWords);
                    }

                    // Append the file if it exists
                    const coverImageFile = (event.target as HTMLFormElement).coverImage.files[0];
                    if (coverImageFile) {
                        formData.append('coverImage', coverImageFile);
                    }

                    const result = await upsertUserAiModel(formData);

                    if (result.success) {
                        toast({ title: 'Success', description: result.message });
                        setIsOpen(false);
                        onSuccess();
                    } else {
                        toast({ variant: 'destructive', title: 'Error', description: result.error || result.message });
                    }
                });
            },
            (errors) => { // onError
                console.error("Form validation failed:", errors);
                toast({ variant: 'destructive', title: 'Invalid Data', description: 'Please check the form for errors.'});
            }
        )(event); // Invoke the handler
    };
    
    const handleDelete = () => {
        if (!model) return;
        startTransition(async () => {
            const result = await deleteModel(model.id);
            if (result.success) {
                toast({ title: 'Success', description: 'Model deleted.' });
                setIsOpen(false);
                onSuccess();
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <form onSubmit={handleFormSubmit}>
                    <DialogHeader>
                        <DialogTitle>{isEditing ? `Edit: ${model?.name}` : 'Add Custom Model'}</DialogTitle>
                        <DialogDescription>Add a model from Hugging Face to use in the generator.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2">
                            <Label>Name</Label>
                            <Input {...form.register('name')} placeholder="My Awesome LoRA"/>
                        </div>
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select onValueChange={(value) => form.setValue('type', value as 'model' | 'lora')} defaultValue={form.getValues('type')}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="lora">LoRA</SelectItem>
                                    <SelectItem value="model">Base Model</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                             <Label>Hugging Face ID</Label>
                             <Input {...form.register('hf_id')} placeholder="username/repo-name" />
                        </div>
                         <div className="space-y-2 col-span-2">
                            <Label>Trigger Words (comma-separated)</Label>
                            <Textarea {...form.register('triggerWords')} placeholder="word1, word2, style" />
                        </div>
                        <div className="space-y-2 col-span-2">
                            <Label>Cover Image</Label>
                            <Input name="coverImage" id="coverImage" type="file" accept="image/png, image/jpeg" />
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-between mt-4">
                         {isEditing && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button type="button" variant="destructive" disabled={isProcessing}>
                                        <Trash2/> Delete
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
                        {!isEditing && <div />}
                        <Button type="submit" disabled={isProcessing}>
                            {isProcessing && <Loader2 className="animate-spin mr-2"/>}
                            {isEditing ? 'Save Changes' : 'Add Model'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}


export function MyModelsTab() {
    const [models, setModels] = useState<AiModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { userProfile } = useAuth();

    const fetchModels = async () => {
        if (!userProfile) return;
        setIsLoading(true);
        try {
            // Fetch all models available to the user (system + their own)
            const allModels = await getModelsForUser('model');
            const allLoras = await getModelsForUser('lora');
            
            // Filter to show only the ones they own
            const userOwnedModels = [...allModels, ...allLoras].filter(m => m.userId === userProfile.uid);
            setModels(userOwnedModels);

        } catch (error) {
            console.error("Failed to fetch user models", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userProfile]);

    if (isLoading) {
        return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>My Custom Models</CardTitle>
                    <CardDescription>Manage your personal collection of AI models from Hugging Face.</CardDescription>
                </div>
                <ModelEditDialog 
                    onSuccess={fetchModels} 
                    trigger={<Button><PlusCircle /> Add New</Button>} 
                />
            </CardHeader>
            <CardContent>
                {models.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {models.map(model => (
                            <Card key={model.id} className="overflow-hidden flex flex-col">
                                <CardHeader className="p-0">
                                     <div className="relative aspect-[4/3] bg-muted/20">
                                        <MediaDisplay url={model.coverMediaUrl} alt={model.name} />
                                     </div>
                                </CardHeader>
                                <CardContent className="p-4 flex-grow">
                                    <CardTitle className="text-lg">{model.name}</CardTitle>
                                    <CardDescription className="text-xs truncate">{model.hf_id}</CardDescription>
                                     <div className="flex flex-wrap gap-1 mt-2">
                                        <Badge variant="secondary">{model.type}</Badge>
                                        {model.triggerWords?.slice(0, 2).map(word => <Badge key={word} variant="outline">{word}</Badge>)}
                                        {model.triggerWords && model.triggerWords.length > 2 && <Badge variant="outline">...</Badge>}
                                    </div>
                                </CardContent>
                                <CardFooter className="p-4 pt-0 mt-auto">
                                    <ModelEditDialog 
                                        model={model} 
                                        onSuccess={fetchModels} 
                                        trigger={<Button variant="outline" size="sm" className="w-full"><Pencil /> Edit</Button>}
                                    />
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-lg">
                        <Bot className="mx-auto h-12 w-12 mb-4" />
                        <h3 className="text-lg font-semibold">No custom models yet.</h3>
                        <p className="text-sm">Add your own models from Hugging Face to get started.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
