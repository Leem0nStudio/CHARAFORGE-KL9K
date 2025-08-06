
'use client';

import { useState, useTransition, useMemo } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { upsertDataPack, deleteDataPack } from '../actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, PlusCircle, Trash2, Wand2, Eye } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { DataPack, UpsertDataPack, DataPackSchema } from '@/types/datapack';


// Zod Schemas
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
  options: z.array(OptionSchema).min(1, "At least one option is required."),
});
const FormSchema = z.object({
  // Metadata
  name: z.string().min(1, 'Name is required'),
  author: z.string().min(1, 'Author is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['free', 'premium', 'temporal']),
  price: z.number().min(0),
  tags: z.string().optional(),
  // Schema
  promptTemplate: z.string().min(1, "Prompt template is required"),
  slots: z.array(SlotSchema),
});
type FormValues = z.infer<typeof FormSchema>;

// Helper function to stringify schema with consistent formatting
const getFormattedSchema = (values: FormValues): string => {
  const finalSchema: DataPackSchema = {
    name: values.name,
    version: "2.0",
    promptTemplate: values.promptTemplate,
    slots: values.slots.map(s => ({
      ...s,
      options: s.options.map(o => ({
        ...o,
        exclusions: (o.exclusions || []).map(e => ({
          ...e,
          optionValues: e.optionValues.split(',').map(v => v.trim()).filter(Boolean),
        })),
      }))
    })),
  };
  return JSON.stringify(finalSchema, null, 2);
};


// Main Form Component
export function EditDataPackForm({ initialData, initialSchema }: { initialData: DataPack | null, initialSchema: string | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [coverImage, setCoverImage] = useState<File | null>(null);

  const defaultValues = useMemo(() => {
    let schema: DataPackSchema | null = null;
    if (initialSchema) {
      try {
        schema = JSON.parse(initialSchema);
      } catch {
        toast({ variant: 'destructive', title: 'Error parsing initial schema' });
      }
    }
    return {
      name: initialData?.name || '',
      author: initialData?.author || 'CharaForge',
      description: initialData?.description || '',
      type: initialData?.type || 'free',
      price: initialData?.price || 0,
      tags: initialData?.tags?.join(', ') || '',
      promptTemplate: schema?.promptTemplate || 'A {style} portrait of a {gender} {base_type}.',
      slots: schema?.slots.map(s => ({
        ...s,
        options: (s.options || []).map(o => ({
          ...o,
          exclusions: (o.exclusions || []).map(e => ({ ...e, optionValues: e.optionValues.join(',') })),
        })),
      })) || [],
    };
  }, [initialData, initialSchema, toast]);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues,
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      let imageBuffer: Buffer | undefined = undefined;
      if (coverImage) {
        const arrayBuffer = await coverImage.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
      }
      
      const dataToSave: UpsertDataPack = {
        id: initialData?.id,
        name: values.name,
        author: values.author,
        description: values.description,
        type: values.type,
        price: values.price,
        tags: values.tags || '',
        schema: getFormattedSchema(values),
      };

      const result = await upsertDataPack(dataToSave, imageBuffer);
      if (result.success) {
        toast({ title: 'Success!', description: result.message });
        router.push('/admin/datapacks');
        router.refresh();
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };

  const handleDelete = () => {
    if (!initialData?.id) return;
    startTransition(async () => {
      const result = await deleteDataPack(initialData.id);
      if (result.success) {
        toast({ title: 'Success!', description: result.message });
        router.push('/admin/datapacks');
        router.refresh();
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Tabs defaultValue="metadata">
        <div className="flex items-center justify-between mb-4">
            <TabsList>
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
                <TabsTrigger value="schema">Schema Editor</TabsTrigger>
            </TabsList>
             <div className="flex items-center gap-2">
                {initialData && (
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
                <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="animate-spin mr-2" />}
                    {initialData ? 'Save Changes' : 'Create DataPack'}
                </Button>
            </div>
        </div>

        <TabsContent value="metadata">
          <Card>
            <CardHeader><CardTitle>DataPack Metadata</CardTitle><CardDescription>Information about the pack shown in the public catalog.</CardDescription></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div><Label>Name</Label><Input {...form.register('name')} />{form.formState.errors.name && <p className="text-destructive text-sm mt-1">{form.formState.errors.name.message}</p>}</div>
                <div><Label>Author</Label><Input {...form.register('author')} />{form.formState.errors.author && <p className="text-destructive text-sm mt-1">{form.formState.errors.author.message}</p>}</div>
                <div><Label>Description</Label><Textarea {...form.register('description')} />{form.formState.errors.description && <p className="text-destructive text-sm mt-1">{form.formState.errors.description.message}</p>}</div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Type</Label><Select onValueChange={(v) => form.setValue('type', v as any)} value={form.watch('type')}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="free">Free</SelectItem><SelectItem value="premium">Premium</SelectItem><SelectItem value="temporal">Temporal</SelectItem></SelectContent></Select></div>
                  <div><Label>Price</Label><Input type="number" {...form.register('price', { valueAsNumber: true })} /></div>
                </div>
                <div><Label>Tags (comma-separated)</Label><Input {...form.register('tags')} /></div>
                <div><Label>Cover Image</Label><Input type="file" accept="image/png" onChange={e => setCoverImage(e.target.files?.[0] || null)} /></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schema">
            <div className="grid lg:grid-cols-2 gap-6">
                <SchemaEditor form={form} />
                <SchemaPreview form={form} />
            </div>
        </TabsContent>
      </Tabs>
    </form>
  );
}


// Schema Editor Component
function SchemaEditor({ form }: { form: any }) {
    const { fields: slots, append: appendSlot, remove: removeSlot } = useFieldArray({
        control: form.control,
        name: "slots"
    });

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Prompt Schema</CardTitle>
                    <CardDescription>Define the building blocks of your prompt.</CardDescription>
                </div>
                 <Button type="button" variant="outline" size="sm" onClick={() => appendSlot({ id: '', label: '', options: [{label: '', value: ''}] })}>
                    <PlusCircle className="mr-2"/> Add Slot
                </Button>
            </CardHeader>
            <CardContent>
                 <div className="space-y-2 mb-6">
                    <Label>Prompt Template</Label>
                    <Textarea {...form.register('promptTemplate')} className="font-mono text-xs" placeholder="A {style} portrait of a {gender} {base_type}..." />
                    {form.formState.errors.promptTemplate && <p className="text-destructive text-sm mt-1">{form.formState.errors.promptTemplate.message}</p>}
                </div>
                 <Accordion type="multiple" className="space-y-4">
                     {slots.map((slot, slotIndex) => (
                        <SlotForm key={slot.id} slotIndex={slotIndex} removeSlot={removeSlot} control={form.control} register={form.register} />
                     ))}
                </Accordion>
                {form.formState.errors.slots && <p className="text-destructive text-sm mt-4">{(form.formState.errors.slots as any).message || 'Error in slots.'}</p>}
            </CardContent>
        </Card>
    );
}

// Slot Form
function SlotForm({ slotIndex, control, register, removeSlot }: any) {
    const { fields: options, append: appendOption, remove: removeOption } = useFieldArray({
        control, name: `slots.${slotIndex}.options`
    });
    return (
        <AccordionItem value={`slot-${slotIndex}`} className="bg-muted/50 p-4 rounded-lg border">
            <div className="flex items-center justify-between w-full">
                <AccordionTrigger className="flex-grow font-semibold text-primary">Slot #{slotIndex + 1}</AccordionTrigger>
                <Button type="button" variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); removeSlot(slotIndex);}}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
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
                    <div className="flex items-center justify-between mb-2"><Label>Options</Label><Button type="button" variant="outline" size="sm" onClick={() => appendOption({ label: '', value: '' })}><PlusCircle className="mr-2"/> Add Option</Button></div>
                    <div className="space-y-3">{options.map((option, optionIndex) => (<OptionForm key={option.id} {...{slotIndex, optionIndex, removeOption, control, register}} />))}</div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}

// Option Form
function OptionForm({ slotIndex, optionIndex, control, register, removeOption }: any) {
    const { fields: exclusions, append: appendExclusion, remove: removeExclusion } = useFieldArray({
        control, name: `slots.${slotIndex}.options.${optionIndex}.exclusions`
    });
    return (
        <div className="border p-3 rounded-md bg-background space-y-3">
            <div className="flex items-center gap-2">
                <Input {...register(`slots.${slotIndex}.options.${optionIndex}.label`)} placeholder="Label (e.g., 'Cyber Visor')" />
                <Input {...register(`slots.${slotIndex}.options.${optionIndex}.value`)} placeholder="Value (e.g., 'cyber_visor')" />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(optionIndex)}><Trash2 className="w-4 h-4 text-destructive"/></Button>
            </div>
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="exclusions"><AccordionTrigger className="text-xs py-1 text-muted-foreground">Exclusion Rules ({exclusions.length})</AccordionTrigger>
                    <AccordionContent className="space-y-2 pt-2">
                        {exclusions.map((_, exclusionIndex) => (
                            <div key={exclusionIndex} className="flex items-center gap-2">
                                <Input {...register(`slots.${slotIndex}.options.${optionIndex}.exclusions.${exclusionIndex}.slotId`)} placeholder="Target Slot ID (e.g., 'face')" />
                                <Input {...register(`slots.${slotIndex}.options.${optionIndex}.exclusions.${exclusionIndex}.optionValues`)} placeholder="Values (e.g., 'mask,goggles')" />
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeExclusion(exclusionIndex)}><Trash2 className="w-4 h-4 text-destructive"/></Button>
                            </div>
                        ))}
                        <Button type="button" variant="ghost" size="sm" onClick={() => appendExclusion({ slotId: '', optionValues: ''})}><PlusCircle className="mr-2"/> Add Exclusion Rule</Button>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}

// Live Preview Component
function SchemaPreview({ form }: { form: any }) {
    const { watch } = form;
    const allFormValues = watch();
    const { slots = [], promptTemplate = '' } = allFormValues;
    const [previewSelections, setPreviewSelections] = useState<Record<string, string>>({});

    const finalPrompt = useMemo(() => {
        let prompt = promptTemplate;
        for (const key in previewSelections) {
            prompt = prompt.replace(`{${key}}`, previewSelections[key] || '');
        }
        // This regex cleans up remaining placeholders and handles extra commas/spaces
        return prompt.replace(/\{[a-zA-Z0-9_.]+\}/g, '').replace(/(\s*,\s*)+/g, ', ').replace(/^,|,$/g, '').trim();
    }, [previewSelections, promptTemplate]);

    return (
        <Card className="sticky top-20">
            <CardHeader><CardTitle className="flex items-center gap-2"><Eye /> Live Preview & Test</CardTitle><CardDescription>This is how the wizard will appear to users. Interact with it to test your schema.</CardDescription></CardHeader>
            <CardContent>
                {slots.length === 0 ? (
                     <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 min-h-[200px] border-2 border-dashed rounded-lg bg-card/50">
                        <Wand2 className="h-12 w-12 mb-4 text-primary" />
                        <p>Add a slot to begin building your wizard.</p>
                     </div>
                ) : (
                    <div className="space-y-4">
                        {slots.map((slot: any) => (
                            <div key={slot.id}>
                                <Label>{slot.label || 'Unnamed Slot'}</Label>
                                <Select onValueChange={(value) => setPreviewSelections(prev => ({...prev, [slot.id]: value}))}>
                                    <SelectTrigger><SelectValue placeholder={slot.placeholder || "Select..."} /></SelectTrigger>
                                    <SelectContent>
                                        {slot.options.map((option: any) => (
                                            <SelectItem key={option.value} value={option.value}>{option.label || 'Unnamed Option'}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex-col items-start gap-2">
                <Label className="text-base">Final Prompt</Label>
                <div className="w-full p-3 rounded-md bg-muted text-sm font-mono min-h-[80px] text-muted-foreground">{finalPrompt || '...'}</div>
            </CardFooter>
        </Card>
    )
}
