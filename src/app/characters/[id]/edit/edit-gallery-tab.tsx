
'use client';

import { useTransition, useEffect } from 'react';
import Image from 'next/image';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Character } from '@/types/character';
import { generateNewCharacterImage, updateCharacterImages } from '@/app/actions/character-image';
import { uploadToStorage } from '@/services/storage';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Star, Trash2, FileUp, Wand2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { v4 as uuidv4 } from 'uuid';

const UpdateImagesSchema = z.object({
    images: z.array(z.string().url()).min(1, "At least one image is required.").max(10, "You can add a maximum of 10 images."),
    primaryImageUrl: z.string().url("A primary image must be selected."),
});
type UpdateImagesFormValues = z.infer<typeof UpdateImagesSchema>;

export function EditGalleryTab({ character, onGalleryUpdate }: { character: Character, onGalleryUpdate: (gallery: string[], primaryImage?: string) => void }) {
  const { toast } = useToast();
  const [isUpdating, startUpdateTransition] = useTransition();
  const [isUploading, startUploadTransition] = useTransition();
  const [isGenerating, startGenerateTransition] = useTransition();

  const form = useForm<UpdateImagesFormValues>({
    resolver: zodResolver(UpdateImagesSchema),
    defaultValues: {
      images: character.gallery || [character.imageUrl],
      primaryImageUrl: character.imageUrl,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "images",
    keyName: "id",
  });
  
  useEffect(() => {
    form.reset({
        images: character.gallery || [character.imageUrl],
        primaryImageUrl: character.imageUrl,
    });
  }, [character, form]);


  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (fields.length >= 10) {
        toast({ variant: 'destructive', title: 'Gallery Full', description: 'You cannot add more than 10 images.' });
        return;
    }

    startUploadTransition(async () => {
        try {
            const fileName = `${uuidv4()}-${file.name}`;
            const destinationPath = `usersImg/${character.userId}/${character.id}/${fileName}`;
            const newImageUrl = await uploadToStorage(file, destinationPath);
            append(newImageUrl);
            onGalleryUpdate([...fields.map(f => f.value), newImageUrl]);
            toast({ title: "Image Uploaded!", description: "The new image has been added to your gallery."});
        } catch (error) {
             const message = error instanceof Error ? error.message : "Could not upload the image.";
             toast({ variant: 'destructive', title: 'Upload Failed', description: message });
        }
    });
  };

  const handleImageGeneration = () => {
    if (fields.length >= 10) {
        toast({ variant: 'destructive', title: 'Gallery Full', description: 'You cannot add more than 10 images.' });
        return;
    }

    startGenerateTransition(async () => {
        const result = await generateNewCharacterImage(character.id, character.description, {} as any); // TODO: Pass engine config
        if (result.success && result.newImageUrl) {
            append(result.newImageUrl);
            onGalleryUpdate([...fields.map(f => f.value), result.newImageUrl]);
            toast({ title: "Image Generated!", description: result.message});
        } else {
             toast({ variant: 'destructive', title: 'Generation Failed', description: result.message });
        }
    });
  };

  const handleSetPrimary = (url: string) => {
    form.setValue('primaryImageUrl', url, { shouldDirty: true });
  };
  
  const handleRemoveImage = (index: number) => {
    const newImages = fields.filter((_, i) => i !== index).map(f => f.value);
    remove(index);
    if (newImages.length > 0 && form.watch('primaryImageUrl') === fields[index].value) {
        form.setValue('primaryImageUrl', newImages[0], { shouldDirty: true });
    }
  }

  const onSubmit = (data: UpdateImagesFormValues) => {
    startUpdateTransition(async () => {
      const result = await updateCharacterImages(character.id, data.images, data.primaryImageUrl);
      toast({
            title: result.success ? 'Success!' : 'Update Failed',
            description: result.message,
            variant: result.success ? 'default' : 'destructive',
      });
      if (result.success) {
        onGalleryUpdate(data.images, data.primaryImageUrl);
        form.reset(data); 
      }
    });
  };

  const primaryImageUrl = form.watch('primaryImageUrl');

  return (
     <Card>
        <CardHeader>
            <CardTitle>Image Gallery</CardTitle>
            <CardDescription>Manage your character's portraits. Upload new ones or generate them with AI.</CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 min-h-[200px]">
                    {fields.map((field, index) => (
                        <Card key={field.id} className="group relative overflow-hidden">
                            <div className="relative w-full aspect-square bg-muted/20">
                                <Image src={field.value} alt={`Character image ${index + 1}`} fill className="w-full object-contain" />
                            </div>
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-2 gap-1">
                                <Button type="button" size="sm" className="w-full" onClick={() => handleSetPrimary(field.value)} disabled={primaryImageUrl === field.value}>
                                    <Star className="mr-2" /> {primaryImageUrl === field.value ? 'Primary' : 'Set Primary'}
                                </Button>
                                <Button type="button" variant="destructive" size="sm" className="w-full" onClick={() => handleRemoveImage(index)} disabled={fields.length <= 1}>
                                    <Trash2 className="mr-2" /> Remove
                                </Button>
                            </div>
                            {primaryImageUrl === field.value && (
                                <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1.5 text-xs shadow-lg">
                                    <Star className="w-3 h-3 fill-current" />
                                </div>
                            )}
                        </Card>
                    ))}
                    {fields.length < 10 && (
                        <Card className="flex items-center justify-center border-2 border-dashed bg-muted/50 hover:border-primary transition-colors">
                            <div className="p-4 text-center">
                                <div className="flex justify-center mb-2">
                                     <Label htmlFor="image-upload" className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                        <FileUp className="mr-2" /> Upload
                                    </Label>
                                    <Input id="image-upload" type="file" className="hidden" onChange={handleImageUpload} accept="image/png, image/jpeg, image/webp" disabled={isUploading || isGenerating}/>
                                </div>
                                 <p className="text-xs text-muted-foreground my-2">or</p>
                                <Button type="button" variant="outline" size="sm" onClick={handleImageGeneration} disabled={isGenerating || isUploading}>
                                    {isGenerating ? <Loader2 className="mr-2 animate-spin" /> : <Wand2 className="mr-2" />}
                                    Generate
                                </Button>
                            </div>
                        </Card>
                    )}
                </div>
                {form.formState.errors.images && <p className="text-sm font-medium text-destructive">{form.formState.errors.images.message}</p>}
            
                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button type="submit" disabled={isUpdating || !form.formState.isDirty}>
                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Gallery
                    </Button>
                </div>
            </form>
        </CardContent>
     </Card>
  );
}
