
'use client';

import { useEffect, useState, useTransition, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';

import type { Character } from '@/types/character';
import { updateCharacter, updateCharacterImages, uploadCharacterImage } from '@/app/actions/characters';
import { useToast } from '@/hooks/use-toast';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Star, Trash2, FileUp } from 'lucide-react';
import Image from 'next/image';
import { Label } from '@/components/ui/label';

// #region Schemas and Types
const UpdateCharacterSchema = z.object({
  name: z.string().min(1, "Name is required.").max(100, "Name cannot exceed 100 characters."),
  biography: z.string().min(1, "Biography is required.").max(15000, "Biography is too long."),
});

const UpdateImagesSchema = z.object({
    images: z.array(z.string().url()).min(1, "At least one image is required.").max(10, "You can add a maximum of 10 images."),
    primaryImageUrl: z.string().url("A primary image must be selected."),
});

type UpdateCharacterFormValues = z.infer<typeof UpdateCharacterSchema>;
type UpdateImagesFormValues = z.infer<typeof UpdateImagesSchema>;
// #endregion

// #region Sub-components
function EditTab({ character, onUpdate }: { character: Character, onUpdate: (data: Partial<Character>) => void }) {
    const { toast } = useToast();
    const [isUpdating, startUpdateTransition] = useTransition();

    const form = useForm<UpdateCharacterFormValues>({
        resolver: zodResolver(UpdateCharacterSchema),
        defaultValues: {
            name: character.name,
            biography: character.biography,
        },
    });

    const onSubmit = (data: UpdateCharacterFormValues) => {
        startUpdateTransition(async () => {
            const result = await updateCharacter(character.id, data);
            toast({
                title: result.success ? 'Success!' : 'Update Failed',
                description: result.message,
                variant: result.success ? 'default' : 'destructive',
            });
            if (result.success) {
                onUpdate(data);
            }
        });
    };
    
    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="name">Character Name</Label>
                <Input id="name" {...form.register('name')} />
                {form.formState.errors.name && <p className="text-sm font-medium text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="biography">Biography</Label>
                <Textarea id="biography" {...form.register('biography')} className="min-h-[250px] w-full" />
                 {form.formState.errors.biography && <p className="text-sm font-medium text-destructive">{form.formState.errors.biography.message}</p>}
            </div>
            <div className="flex justify-end gap-2">
                <Button type="submit" disabled={isUpdating}>
                    {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Details
                </Button>
            </div>
        </form>
    );
}

function ImagesTab({ character, onUpdate }: { character: Character, onUpdate: (data: Partial<Character>) => void }) {
  const { toast } = useToast();
  const [isUpdating, startUpdateTransition] = useTransition();
  const [isUploading, startUploadTransition] = useTransition();

  const form = useForm<UpdateImagesFormValues>({
    resolver: zodResolver(UpdateImagesSchema),
    defaultValues: {
      images: character.gallery || [character.imageUrl],
      primaryImageUrl: character.imageUrl,
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "images",
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (fields.length >= 10) {
        toast({ variant: 'destructive', title: 'Gallery Full', description: 'You cannot add more than 10 images.' });
        return;
    }

    startUploadTransition(async () => {
        try {
            const newImageUrl = await uploadCharacterImage(character.id, file);
            append(newImageUrl);
            form.setValue('primaryImageUrl', newImageUrl, { shouldDirty: true }); // Optionally set new upload as primary
            toast({ title: "Image Uploaded!", description: "The new image has been added to your gallery."});
        } catch (error) {
             const message = error instanceof Error ? error.message : "Could not upload the image.";
             toast({ variant: 'destructive', title: 'Upload Failed', description: message });
        }
    });
  };

  const handleSetPrimary = (url: string) => {
    form.setValue('primaryImageUrl', url, { shouldDirty: true });
  };

  const onSubmit = (data: UpdateImagesFormValues) => {
    startUpdateTransition(async () => {
      const result = await updateCharacterImages(character.id, data.images, data.primaryImageUrl);
      toast({
            title: result.success ? 'Success!' : 'Update Failed',
            description: result.message,
            variant: result.success ? 'default' : 'destructive',
      });
      if (result.success) {
        onUpdate({ gallery: data.images, imageUrl: data.primaryImageUrl });
      }
    });
  };

  const primaryImageUrl = form.watch('primaryImageUrl');

  return (
     <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {fields.map((field, index) => (
             <Card key={field.id} className="group relative overflow-hidden">
                 <div className="relative w-full aspect-square bg-muted/20">
                    <Image src={(field as any).value || field} alt={`Character image ${index + 1}`} fill className="w-full object-contain" />
                 </div>
                 <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-2 gap-1">
                    <Button type="button" size="sm" className="w-full" onClick={() => handleSetPrimary(field as any)} disabled={primaryImageUrl === (field as any)}>
                        <Star className="mr-2" /> {primaryImageUrl === (field as any) ? 'Primary' : 'Set Primary'}
                    </Button>
                    <Button type="button" variant="destructive" size="sm" className="w-full" onClick={() => remove(index)} disabled={fields.length <= 1}>
                        <Trash2 className="mr-2" /> Remove
                    </Button>
                </div>
                {primaryImageUrl === (field as any) && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1.5 text-xs shadow-lg">
                        <Star className="w-3 h-3 fill-current" />
                    </div>
                )}
             </Card>
          ))}
            <Card className="flex items-center justify-center border-2 border-dashed bg-muted/50 hover:border-primary transition-colors">
                <Label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-4 text-center">
                    {isUploading ? (
                         <>
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            <span className="mt-2 text-sm text-muted-foreground">Uploading...</span>
                        </>
                    ) : (
                         <>
                            <FileUp className="h-8 w-8 text-muted-foreground" />
                            <span className="mt-2 text-sm font-semibold text-muted-foreground">Upload Image</span>
                         </>
                    )}
                </Label>
                <Input id="image-upload" type="file" className="hidden" onChange={handleImageUpload} accept="image/png, image/jpeg, image/webp" disabled={isUploading}/>
            </Card>
       </div>
        {form.formState.errors.images && <p className="text-sm font-medium text-destructive">{form.formState.errors.images.message}</p>}
       
        <div className="flex justify-end gap-2">
            <Button type="submit" disabled={isUpdating || !form.formState.isDirty}>
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Gallery
            </Button>
        </div>
     </form>
  );
}

// #endregion


export function EditCharacterForm({ character }: { character: Character }) {
    const [characterState, setCharacterState] = useState(character);
    const router = useRouter();

    useEffect(() => {
        setCharacterState(character);
    }, [character]);
    
    const handleCharacterUpdate = (data: Partial<Character>) => {
        setCharacterState(prev => ({ ...prev, ...data }));
        router.refresh(); // Re-fetches server data and re-renders
    };

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Core Details</CardTitle>
                    <CardDescription>Modify the fields below to update your character's story.</CardDescription>
                </CardHeader>
                <CardContent>
                    <EditTab character={characterState} onUpdate={handleCharacterUpdate} />
                </CardContent>
            </Card>
            
             <Card>
                <CardHeader>
                    <CardTitle>Image Gallery</CardTitle>
                    <CardDescription>Upload new images, manage your gallery, and set a primary image.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ImagesTab character={characterState} onUpdate={handleCharacterUpdate} />
                </CardContent>
            </Card>
        </div>
    );
}
