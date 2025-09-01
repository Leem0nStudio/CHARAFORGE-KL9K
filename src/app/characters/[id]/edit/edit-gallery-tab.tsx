
'use client';

import { useTransition, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Character, ShowcaseProcessingStatus } from '@/types/character';
import { generateNewCharacterImage, updateCharacterImages, reprocessCharacterImage } from '@/app/actions/character-image';
import { getModels } from '@/app/actions/ai-models';
import { uploadToStorage } from '@/services/storage';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Star, Trash2, FileUp, Wand2, Image as ImageIcon, CheckCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { v4 as uuidv4 } from 'uuid';
import { ModelSelectorModal } from '@/components/model-selector-modal';
import type { ImageEngineConfig } from '@/ai/flows/character-image/types';
import type { AiModel } from '@/types/ai-model';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

const UpdateImagesSchema = z.object({
    primaryImageUrl: z.string().url("A primary image must be selected."),
});
type UpdateImagesFormValues = z.infer<typeof UpdateImagesSchema>;

// Map of processing statuses to user-friendly messages
const processingStatusMap: Record<ShowcaseProcessingStatus, string> = {
    idle: 'Not processed yet.',
    'removing-background': 'Removing background...',
    upscaling: 'Upscaling image...',
    finalizing: 'Finalizing...',
    complete: 'Processing complete!',
    failed: 'Processing failed.',
}

export function EditGalleryTab({ character }: { character: Character }) {
  const { toast } = useToast();
  const router = useRouter();
  const [isUpdating, startUpdateTransition] = useTransition();
  const [isUploading, startUploadTransition] = useTransition();
  const [isGenerating, startGenerateTransition] = useTransition();
  const [isReprocessing, startReprocessTransition] = useTransition();
  
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [availableModels, setAvailableModels] = useState<AiModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [isConfirmReprocessOpen, setIsConfirmReprocessOpen] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<UpdateImagesFormValues>({
    resolver: zodResolver(UpdateImagesSchema),
    defaultValues: {
      primaryImageUrl: character.visuals.imageUrl,
    },
  });
  
  const isShowcaseProcessing = character.visuals.showcaseProcessingStatus === 'removing-background' || 
                                character.visuals.showcaseProcessingStatus === 'upscaling' || 
                                character.visuals.showcaseProcessingStatus === 'finalizing';

  useEffect(() => {
    form.reset({ primaryImageUrl: character.visuals.imageUrl });
  }, [character.visuals.imageUrl, form]);
  
  useEffect(() => {
    if (isShowcaseProcessing && !pollingIntervalRef.current) {
        pollingIntervalRef.current = setInterval(() => {
            router.refresh();
        }, 5000);
    } else if (!isShowcaseProcessing && pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
    }
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isShowcaseProcessing, router]);


  useEffect(() => {
    async function loadModels() {
      setIsLoadingModels(true);
      try {
        const models = await getModels('model');
        setAvailableModels(models);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load AI models.' });
      } finally {
        setIsLoadingModels(false);
      }
    }
    loadModels();
  }, [toast]);


  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if ((character.visuals.gallery?.length ?? 0) >= 10) {
        toast({ variant: 'destructive', title: 'Gallery Full', description: 'You cannot add more than 10 images.' });
        return;
    }

    startUploadTransition(async () => {
        try {
            const fileName = `${uuidv4()}-${file.name}`;
            const destinationPath = `usersImg/${character.meta.userId}/${character.id}/${fileName}`;
            const newImageUrl = await uploadToStorage(file, destinationPath);
            
            const newGallery = [...(character.visuals.gallery || []), newImageUrl];
            await updateCharacterImages(character.id, newGallery, character.visuals.imageUrl);

            toast({ title: "Image Uploaded!", description: "The new image has been added to your gallery."});
            router.refresh(); 
        } catch (error) {
             const message = error instanceof Error ? error.message : "Could not upload the image.";
             toast({ variant: 'destructive', title: 'Upload Failed', description: message });
        }
    });
  };

  const handleImageGeneration = (selectedModel: AiModel) => {
    setIsModelModalOpen(false);
    if ((character.visuals.gallery?.length ?? 0) >= 10) {
        toast({ variant: 'destructive', title: 'Gallery Full', description: 'You cannot add more than 10 images.' });
        return;
    }

    startGenerateTransition(async () => {
        const engineConfig: ImageEngineConfig = {
            engineId: selectedModel.engine,
            modelId: selectedModel.engine !== 'gemini' ? selectedModel.hf_id : undefined,
            aspectRatio: '1:1',
        };

        const result = await generateNewCharacterImage(character.id, character.core.physicalDescription || '', engineConfig);
        
        if (result.success && result.newImageUrl) {
            toast({ title: "Image Generated!", description: result.message});
            router.refresh(); 
        } else {
             toast({ variant: 'destructive', title: 'Generation Failed', description: result.message });
        }
    });
  };

  const handleSetPrimary = (url: string) => {
    form.setValue('primaryImageUrl', url, { shouldDirty: true });
  };
  
  const handleRemoveImage = (urlToRemove: string) => {
    const newGallery = character.visuals.gallery?.filter(url => url !== urlToRemove) || [];
    if (newGallery.length === 0) {
        toast({ variant: 'destructive', title: 'Action not allowed', description: 'You cannot remove the last image.' });
        return;
    }
    
    startUpdateTransition(async () => {
        const newPrimary = (form.watch('primaryImageUrl') === urlToRemove) ? (newGallery[0] || '') : form.watch('primaryImageUrl');
        const result = await updateCharacterImages(character.id, newGallery, newPrimary);
        
        toast({
            title: result.success ? 'Image Removed' : 'Update Failed',
            description: result.message,
            variant: result.success ? 'default' : 'destructive',
        });

        if (result.success) {
            router.refresh();
        }
    });
  }
  
  const handleReprocess = () => {
    startReprocessTransition(async () => {
        const result = await reprocessCharacterImage(character.id);
        toast({
            title: result.success ? 'Success!' : 'Reprocessing Failed',
            description: result.message,
            variant: result.success ? 'default' : 'destructive',
        });
        if (result.success) {
            router.refresh();
        }
    });
  }
  
  const handleReprocessWithConfirmation = () => {
      if (character.visuals.showcaseImageUrl) {
        setIsConfirmReprocessOpen(true);
      } else {
        handleReprocess();
      }
  }

  const onSubmit = (data: UpdateImagesFormValues) => {
    startUpdateTransition(async () => {
      const result = await updateCharacterImages(character.id, character.visuals.gallery || [], data.primaryImageUrl);
      toast({
            title: result.success ? 'Success!' : 'Update Failed',
            description: result.message,
            variant: result.success ? 'default' : 'destructive',
      });
      if (result.success) {
        form.reset({ primaryImageUrl: data.primaryImageUrl });
        router.refresh();
      }
    });
  };

  const isLoading = isUpdating || isUploading || isGenerating || isReprocessing;
  const gallery = character.visuals.gallery || [character.visuals.imageUrl];
  const primaryImageUrl = form.watch('primaryImageUrl');

  return (
    <>
      <ModelSelectorModal
          isOpen={isModelModalOpen}
          onClose={() => setIsModelModalOpen(false)}
          onSelect={handleImageGeneration}
          type="model"
          models={availableModels}
          isLoading={isLoadingModels}
      />
       <AlertDialog open={isConfirmReprocessOpen} onOpenChange={setIsConfirmReprocessOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Reprocess Showcase Image?</AlertDialogTitle>
                    <AlertDialogDescription>
                        A showcase image already exists. Are you sure you want to replace it by processing the current primary image again?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => {
                        handleReprocess();
                        setIsConfirmReprocessOpen(false);
                    }}>Yes, Reprocess</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

     <Card>
        <CardHeader>
            <CardTitle>Image Management</CardTitle>
            <CardDescription>Manage your character's portraits, upload new ones, or generate them with AI.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 min-h-[200px]">
                {gallery.map((url, index) => {
                    const isPrimary = primaryImageUrl === url;
                    return (
                        <Card key={url} className={cn("group relative overflow-hidden flex flex-col", isPrimary && "border-primary")}>
                            <div className="relative w-full aspect-square bg-muted/20">
                                <Image src={url} alt={`Character image ${index + 1}`} fill className="w-full object-contain" sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw" />
                            </div>
                            {/* Actions for mobile, always visible */}
                            <div className="md:hidden p-2 flex flex-col gap-1.5 border-t">
                                <Button type="button" size="sm" className="w-full" onClick={() => handleSetPrimary(url)} disabled={isPrimary}>
                                    <Star className="mr-2" /> {isPrimary ? 'Primary' : 'Set Primary'}
                                </Button>
                                {isPrimary && (
                                    <Button type="button" variant="secondary" size="sm" className="w-full" onClick={handleReprocessWithConfirmation} disabled={isReprocessing || isShowcaseProcessing}>
                                        {isReprocessing || isShowcaseProcessing ? <Loader2 className="animate-spin" /> : <ImageIcon className="mr-2" />}
                                        {character.visuals.showcaseImageUrl ? 'Reprocess' : 'Process'}
                                    </Button>
                                )}
                                <Button type="button" variant="destructive" size="sm" className="w-full" onClick={() => handleRemoveImage(url)} disabled={gallery.length <= 1 || isLoading}>
                                    {isLoading && gallery.length > 1 ? <Loader2 className="animate-spin" /> : <><Trash2 className="mr-2" /> Remove</>}
                                </Button>
                            </div>
                            
                            {/* Overlay actions for desktop */}
                             <div className="absolute inset-0 bg-black/60 md:flex flex-col items-center justify-center hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-2 gap-1">
                                <Button type="button" size="sm" className="w-full" onClick={() => handleSetPrimary(url)} disabled={isPrimary}>
                                    <Star className="mr-2" /> {isPrimary ? 'Primary' : 'Set Primary'}
                                </Button>
                                {isPrimary && (
                                    <Button type="button" variant="secondary" size="sm" className="w-full" onClick={handleReprocessWithConfirmation} disabled={isReprocessing || isShowcaseProcessing}>
                                        {isReprocessing || isShowcaseProcessing ? <Loader2 className="animate-spin" /> : <ImageIcon className="mr-2" />}
                                        {character.visuals.showcaseImageUrl ? 'Reprocess' : 'Process'}
                                    </Button>
                                )}
                                <Button type="button" variant="destructive" size="sm" className="w-full" onClick={() => handleRemoveImage(url)} disabled={gallery.length <= 1 || isLoading}>
                                    { isLoading && gallery.length > 1 ? <Loader2 className="animate-spin" /> : <><Trash2 className="mr-2" /> Remove</>}
                                </Button>
                            </div>

                            {isPrimary && (
                                <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1.5 text-xs shadow-lg">
                                    <Star className="w-3 h-3 fill-current" />
                                </div>
                            )}
                            {isPrimary && isShowcaseProcessing && (
                                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center text-foreground p-2 text-center">
                                    <Loader2 className="w-8 h-8 animate-spin mb-2 text-primary" />
                                    <p className="font-semibold text-sm">{processingStatusMap[character.visuals.showcaseProcessingStatus || 'idle']}</p>
                                </div>
                            )}
                        </Card>
                    )
                })}
                {gallery.length < 10 && (
                    <Card className="flex items-center justify-center border-2 border-dashed bg-muted/50 hover:border-primary transition-colors">
                        <div className="p-4 text-center">
                            <div className="flex justify-center mb-2">
                                 <Label htmlFor="image-upload" className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                    {isUploading ? <Loader2 className="mr-2 animate-spin" /> : <FileUp className="mr-2" />} Upload
                                </Label>
                                <Input id="image-upload" type="file" className="hidden" onChange={handleImageUpload} accept="image/png, image/jpeg, image/webp" disabled={isLoading}/>
                            </div>
                             <p className="text-xs text-muted-foreground my-2">or</p>
                            <Button type="button" variant="outline" size="sm" onClick={() => setIsModelModalOpen(true)} disabled={isLoading || isLoadingModels}>
                                {isGenerating ? <Loader2 className="mr-2 animate-spin" /> : <Wand2 className="mr-2" />}
                                Generate
                            </Button>
                        </div>
                    </Card>
                )}
            </div>
             <form onSubmit={form.handleSubmit(onSubmit)}>
                 <div className="flex justify-between items-center pt-4 border-t mt-6">
                    <div className="flex-grow pr-4">
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><ImageIcon className="text-primary"/>Showcase Image Status</h4>
                        {character.visuals.isShowcaseProcessed === true && (
                            <div className="flex items-center gap-2 text-sm text-green-500">
                                <CheckCircle/>
                                <span>Processing complete. Ready for showcase.</span>
                            </div>
                        )}
                         {character.visuals.showcaseProcessingStatus === 'failed' && (
                             <div className="flex items-center gap-2 text-sm text-destructive">
                                <AlertTriangle/>
                                <p>Processing failed. You can try again.</p>
                             </div>
                        )}
                        {isShowcaseProcessing && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="animate-spin" />
                                <span>{processingStatusMap[character.visuals.showcaseProcessingStatus || 'idle']}</span>
                            </div>
                        )}
                         {!character.visuals.isShowcaseProcessed && !isShowcaseProcessing && (
                            <p className="text-sm text-muted-foreground">Not processed yet. Select the primary image and click "Process".</p>
                        )}
                    </div>
                     <div className="flex items-center gap-2">
                        <Button type="submit" disabled={isLoading || !form.formState.isDirty}>
                            {isUpdating ? <Loader2 className="animate-spin" /> : <Star />}
                            Save Primary
                        </Button>
                    </div>
                </div>
             </form>
        </CardContent>
     </Card>
    </>
  );
}
