
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Trash2, Wand2 } from 'lucide-react';
import { upsertDataPack, deleteDataPack, getDataPack } from './actions';
import type { UpsertDataPack, DataPackSchema, Slot, Option } from '@/types/datapack';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// #region Zod Schemas for the new dynamic form
const ExclusionSchema = z.object({
  slotId: z.string().min(1),
  optionValues: z.string().min(1, 'Comma-separated values required'),
});

const OptionSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  exclusions: z.array(ExclusionSchema).optional(),
});

const SlotSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  defaultOption: z.string().optional(),
  placeholder: z.string().optional(),
  options: z.array(OptionSchema),
});

const FormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  author: z.string().min(1, 'Author is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['free', 'premium', 'temporal']),
  price: z.number().min(0),
  tags: z.string().optional(),
  promptTemplate: z.string().min(1, "Prompt template is required"),
  slots: z.array(SlotSchema),
});

type FormValues = z.infer<typeof FormSchema>;
// #endregion


interface DataPackFormProps {
  children: React.ReactNode;
  dataPackId?: string;
}

export function DataPackForm({ children, dataPackId }: DataPackFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      author: 'CharaForge',
      description: '',
      type: 'free',
      price: 0,
      tags: '',
      promptTemplate: '',
      slots: [],
    },
  });

  const { fields: slots, append: appendSlot, remove: removeSlot } = useFieldArray({
    control: form.control,
    name: "slots"
  });

  useEffect(() => {
    if (dataPackId && isOpen) {
      setIsLoadingData(true);
      getDataPack(dataPackId).then(data => {
        if (data) {
           let schema: DataPackSchema;
           try {
               schema = JSON.parse(data.schema);
           } catch {
               toast({ variant: 'destructive', title: 'Error parsing schema' });
               setIsLoadingData(false);
               return;
           }

          form.reset({
            name: data.pack.name,
            author: data.pack.author,
            description: data.pack.description,
            type: data.pack.type,
            price: data.pack.price,
            tags: data.pack.tags.join(', '),
            promptTemplate: schema.promptTemplate,
            slots: schema.slots.map(s => ({
              ...s,
              options: s.options.map(o => ({
                ...o,
                exclusions: o.exclusions?.map(e => ({
                  ...e,
                  optionValues: e.optionValues.join(','), // Convert array to string for the form
                })) || [],
              })) || [],
            })),
          });
        }
        setIsLoadingData(false);
      });
    } else {
        form.reset({
            name: '',
            author: 'CharaForge',
            description: '',
            type: 'free',
            price: 0,
            tags: '',
            promptTemplate: '',
            slots: [],
        });
    }
  }, [dataPackId, isOpen, form, toast]);

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      let imageBuffer: Buffer | undefined = undefined;
      if (coverImage) {
        const arrayBuffer = await coverImage.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
      }

      // Convert form data to the final DataPackSchema format
      const finalSchema: DataPackSchema = {
          name: values.name,
          version: "2.0", // Hardcode for now or make it a field
          promptTemplate: values.promptTemplate,
          slots: values.slots.map(s => ({
              ...s,
              options: s.options.map(o => ({
                  ...o,
                  exclusions: o.exclusions?.map(e => ({
                      ...e,
                      optionValues: e.optionValues.split(',').map(v => v.trim()).filter(Boolean),
                  })) || [],
              }))
          })),
      }
      
      const dataToSave: UpsertDataPack = {
        id: dataPackId,
        name: values.name,
        author: values.author,
        description: values.description,
        type: values.type,
        price: values.price,
        tags: values.tags || '',
        schema: JSON.stringify(finalSchema, null, 2), // Stringify the schema
        options: {} // Options files are now managed within the schema, this can be removed later
      };

      const result = await upsertDataPack(dataToSave, imageBuffer);

      if (result.success) {
        toast({ title: 'Success!', description: result.message });
        setIsOpen(false);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.message,
        });
      }
    });
  };

  const handleDelete = () => {
    if (!dataPackId) return;
    startTransition(async () => {
        const result = await deleteDataPack(dataPackId);
         if (result.success) {
            toast({ title: 'Success!', description: result.message });
            setIsOpen(false);
        } else {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: result.message,
            });
        }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] md:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dataPackId ? 'Edit' : 'Create'} DataPack</DialogTitle>
          <DialogDescription>
            {dataPackId ? 'Update the details for this DataPack.' : 'Fill out the form to create a new DataPack.'}
          </DialogDescription>
        </DialogHeader>

        {isLoadingData ? (
             <div className="flex items-center justify-center p-24">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
             </div>
        ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-4">
            {/* Metadata Section */}
            <Accordion type="single" collapsible defaultValue="item-1">
                <AccordionItem value="item-1">
                    <AccordionTrigger>
                        <h3 className="font-headline text-lg">Metadata & Info</h3>
                    </AccordionTrigger>
                    <AccordionContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <div className="space-y-4">
                             <div>
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" {...form.register('name')} />
                                {form.formState.errors.name && <p className="text-destructive text-sm mt-1">{form.formState.errors.name.message}</p>}
                            </div>
                            <div>
                                <Label htmlFor="author">Author</Label>
                                <Input id="author" {...form.register('author')} />
                                {form.formState.errors.author && <p className="text-destructive text-sm mt-1">{form.formState.errors.author.message}</p>}
                            </div>
                             <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" {...form.register('description')} />
                                {form.formState.errors.description && <p className="text-destructive text-sm mt-1">{form.formState.errors.description.message}</p>}
                            </div>
                        </div>
                         <div className="space-y-4">
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Type</Label>
                                    <Select onValueChange={(v) => form.setValue('type', v as any)} value={form.watch('type')}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="free">Free</SelectItem>
                                            <SelectItem value="premium">Premium</SelectItem>
                                            <SelectItem value="temporal">Temporal</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="price">Price</Label>
                                    <Input id="price" type="number" {...form.register('price', { valueAsNumber: true })} />
                                </div>
                             </div>
                             <div>
                                <Label htmlFor="tags">Tags (comma-separated)</Label>
                                <Input id="tags" {...form.register('tags')} />
                            </div>
                            <div>
                                <Label htmlFor="cover">Cover Image</Label>
                                <Input id="cover" type="file" accept="image/png" onChange={e => setCoverImage(e.target.files?.[0] || null)} />
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
            
            {/* Schema Section */}
            <div>
                 <div className="flex items-center justify-between mb-4">
                     <h3 className="font-headline text-lg">
                        <Wand2 className="inline-block mr-2 text-primary" />
                        Prompt Wizard Builder
                    </h3>
                    <Button type="button" variant="outline" size="sm" onClick={() => appendSlot({ id: '', label: '', options: [] })}>
                      <PlusCircle className="mr-2"/> Add Slot
                    </Button>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="promptTemplate">Prompt Template</Label>
                    <Textarea id="promptTemplate" {...form.register('promptTemplate')} className="font-mono text-xs" placeholder="A {style} portrait of a {gender} {base_type}..." />
                    {form.formState.errors.promptTemplate && <p className="text-destructive text-sm mt-1">{form.formState.errors.promptTemplate.message}</p>}
                </div>
                
                <Accordion type="multiple" className="space-y-2 mt-4">
                     {slots.map((slot, slotIndex) => (
                        <SlotForm key={slot.id} slotIndex={slotIndex} removeSlot={removeSlot} control={form.control} register={form.register} />
                     ))}
                </Accordion>
            </div>

          <DialogFooter className="col-span-1 md:col-span-2 flex justify-between pt-8">
            <div>
                 {dataPackId && (
                     <AlertDialog>
                         <AlertDialogTrigger asChild>
                            <Button type="button" variant="destructive" disabled={isPending}>Delete</Button>
                         </AlertDialogTrigger>
                         <AlertDialogContent>
                             <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle></AlertDialogHeader>
                             <AlertDialogDescription>This will permanently delete the DataPack and all its associated files. This action cannot be undone.</AlertDialogDescription>
                             <AlertDialogFooter>
                                 <AlertDialogCancel>Cancel</AlertDialogCancel>
                                 <AlertDialogAction onClick={handleDelete} disabled={isPending}>
                                     {isPending && <Loader2 className="animate-spin mr-2"/>}
                                     Continue
                                 </AlertDialogAction>
                             </AlertDialogFooter>
                         </AlertDialogContent>
                     </AlertDialog>
                 )}
            </div>
            <Button type="submit" disabled={isPending} size="lg">
              {isPending && <Loader2 className="animate-spin mr-2" />}
              {dataPackId ? 'Save Changes' : 'Create DataPack'}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}


function SlotForm({ slotIndex, control, register, removeSlot }: any) {
    const { fields: options, append: appendOption, remove: removeOption } = useFieldArray({
        control,
        name: `slots.${slotIndex}.options`
    });

    return (
        <AccordionItem value={`slot-${slotIndex}`} className="bg-card/50 p-4 rounded-lg border">
            <AccordionTrigger>
                <div className="flex items-center justify-between w-full">
                    <span className="font-semibold text-primary">Slot #{slotIndex + 1}</span>
                    <Button type="button" variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); removeSlot(slotIndex);}}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input {...register(`slots.${slotIndex}.id`)} placeholder="Slot ID (e.g., 'headgear')" />
                    <Input {...register(`slots.${slotIndex}.label`)} placeholder="Label (e.g., 'Headgear')" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Input {...register(`slots.${slotIndex}.defaultOption`)} placeholder="Default Option Value (optional)" />
                    <Input {...register(`slots.${slotIndex}.placeholder`)} placeholder="Placeholder Text (optional)" />
                </div>

                <div className="border-t pt-4 mt-4">
                     <div className="flex items-center justify-between mb-2">
                        <Label>Options</Label>
                        <Button type="button" variant="outline" size="sm" onClick={() => appendOption({ label: '', value: '', exclusions: [] })}>
                          <PlusCircle className="mr-2"/> Add Option
                        </Button>
                    </div>
                     <div className="space-y-2">
                         {options.map((option, optionIndex) => (
                             <OptionForm key={option.id} slotIndex={slotIndex} optionIndex={optionIndex} removeOption={removeOption} control={control} register={register} />
                         ))}
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    )
}

function OptionForm({ slotIndex, optionIndex, control, register, removeOption }: any) {
     const { fields: exclusions, append: appendExclusion, remove: removeExclusion } = useFieldArray({
        control,
        name: `slots.${slotIndex}.options.${optionIndex}.exclusions`
    });

    return (
        <div className="border p-3 rounded-md bg-background/50 space-y-3">
             <div className="flex items-center gap-2">
                <Input {...register(`slots.${slotIndex}.options.${optionIndex}.label`)} placeholder="Label (e.g., 'Cyber Visor')" />
                <Input {...register(`slots.${slotIndex}.options.${optionIndex}.value`)} placeholder="Value (e.g., 'cyber_visor')" />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(optionIndex)}>
                    <Trash2 className="w-4 h-4 text-destructive"/>
                </Button>
             </div>

             <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="exclusions">
                    <AccordionTrigger className="text-xs py-1 text-muted-foreground">Exclusion Rules ({exclusions.length})</AccordionTrigger>
                    <AccordionContent className="space-y-2 pt-2">
                         {exclusions.map((exclusion, exclusionIndex) => (
                              <div key={exclusion.id} className="flex items-center gap-2">
                                  <Input {...register(`slots.${slotIndex}.options.${optionIndex}.exclusions.${exclusionIndex}.slotId`)} placeholder="Target Slot ID (e.g., 'face')" />
                                  <Input {...register(`slots.${slotIndex}.options.${optionIndex}.exclusions.${exclusionIndex}.optionValues`)} placeholder="Values (e.g., 'mask,goggles')" />
                                   <Button type="button" variant="ghost" size="icon" onClick={() => removeExclusion(exclusionIndex)}>
                                        <Trash2 className="w-4 h-4 text-destructive"/>
                                    </Button>
                              </div>
                         ))}
                        <Button type="button" variant="ghost" size="sm" onClick={() => appendExclusion({ slotId: '', optionValues: ''})}>
                            <PlusCircle className="mr-2"/> Add Exclusion Rule
                        </Button>
                    </AccordionContent>
                </AccordionItem>
             </Accordion>
        </div>
    )
}


    