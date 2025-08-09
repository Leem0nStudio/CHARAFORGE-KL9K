
'use client';

import { useState, useTransition, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { upsertDataPack, deleteDataPack } from '@/app/actions/datapacks';
import { generateDataPackSchema } from '@/ai/flows/generate-datapack-schema';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, PlusCircle, Trash2, Wand2, GripVertical } from 'lucide-react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { DataPack, UpsertDataPack, DataPackSchema, Slot } from '@/types/datapack';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// #region AI Generator Dialog
function AiGeneratorDialog({ onSchemaGenerated }: { onSchemaGenerated: (schema: DataPackSchema) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isGenerating, startTransition] = useTransition();
    const [concept, setConcept] = useState('');
    const { toast } = useToast();

    const handleGenerate = () => {
        if (!concept) return;
        startTransition(async () => {
            try {
                const result = await generateDataPackSchema({ concept });
                onSchemaGenerated(result);
                toast({ title: "Schema Generated!", description: "The AI has populated the schema editor. Please review the results."});
                setIsOpen(false);
            } catch (error) {
                const message = error instanceof Error ? error.message : "An unknown error occurred.";
                toast({ variant: 'destructive', title: 'Generation Failed', description: message });
            }
        });
    }

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                <Button type="button" variant="outline"><Wand2 className="mr-2" /> AI Assistant</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>DataPack AI Assistant</AlertDialogTitle>
                    <AlertDialogDescription>
                        Describe the theme or concept for your DataPack, and the AI will generate a complete schema for you. Be descriptive for the best results.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4 py-4">
                    <Label htmlFor="concept">Concept</Label>
                    <Textarea 
                        id="concept"
                        value={concept}
                        onChange={(e) => setConcept(e.target.value)}
                        placeholder="e.g., Sci-Fi Noir Detectives in a rain-slicked megacity, Elemental Dragons with ancient, warring clans, or Lovecraftian Horror Investigators in 1920s New England."
                        className="min-h-[100px]"
                    />
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleGenerate} disabled={isGenerating || !concept}>
                        {isGenerating && <Loader2 className="mr-2 animate-spin" />}
                        Generate
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
// #endregion

// Zod schemas for the new structured format
const ExclusionSchema = z.object({
    slotId: z.string().min(1, 'Target Slot ID is required.'),
    optionValues: z.array(z.string()).min(1, 'At least one option value is required.'),
});

const OptionSchema = z.object({
    label: z.string().min(1, 'Label is required.'),
    value: z.string().min(1, 'Value is required.'),
    exclusions: z.array(ExclusionSchema).optional(),
});

const SlotSchema = z.object({
    id: z.string().min(1, 'ID is required.'),
    label: z.string().min(1, 'Label is required.'),
    type: z.enum(['text', 'select']).default('select'),
    options: z.array(OptionSchema).optional(),
    defaultOption: z.string().optional(),
    placeholder: z.string().optional(),
});

const DataPackSchemaSchema = z.object({
    promptTemplate: z.string().min(1, 'Prompt template is required.'),
    slots: z.array(SlotSchema).min(1, 'At least one slot is required.'),
});

const FormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  author: z.string().min(1, 'Author is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['free', 'premium', 'temporal']),
  price: z.number().min(0),
  tags: z.string().optional(),
  schema: DataPackSchemaSchema,
});

type FormValues = z.infer<typeof FormSchema>;

// Main Form Component
export function EditDataPackForm({ initialData }: { initialData: DataPack | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [coverImage, setCoverImage] = useState<File | null>(null);

  const defaultValues = useMemo<FormValues>(() => {
    return {
      name: initialData?.name || '',
      author: initialData?.author || 'CharaForge',
      description: initialData?.description || '',
      type: initialData?.type || 'free',
      price: initialData?.price || 0,
      tags: initialData?.tags?.join(', ') || '',
      schema: initialData?.schema || {
        promptTemplate: 'A {style} portrait of a {race} {class}.',
        slots: [],
      },
    };
  }, [initialData]);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues,
    mode: 'onChange',
  });

  const { fields: slotFields, append: appendSlot, remove: removeSlot, move: moveSlot } = useFieldArray({
    control: form.control,
    name: "schema.slots",
  });
  
  const handleAiSchemaGenerated = (generatedSchema: DataPackSchema) => {
    form.setValue('schema', generatedSchema, { shouldValidate: true });
  };

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
        schema: values.schema,
      };

      const result = await upsertDataPack(dataToSave, imageBuffer);
      if (result.success) {
        toast({ title: 'Success!', description: result.message });
        router.push('/admin/datapacks');
        router.refresh();
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error || result.message });
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
                             <AlertDialogDescription>This will permanently delete the DataPack. This action cannot be undone.</AlertDialogDescription>
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
                  <div><Label>Type</Label><Select onValueChange={(v) => form.setValue('type', v as any)} defaultValue={form.getValues('type')}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="free">Free</SelectItem><SelectItem value="premium">Premium</SelectItem><SelectItem value="temporal">Temporal</SelectItem></SelectContent></Select></div>
                  <div><Label>Price</Label><Input type="number" {...form.register('price', { valueAsNumber: true })} /></div>
                </div>
                <div><Label>Tags (comma-separated)</Label><Input {...form.register('tags')} /></div>
                <div><Label>Cover Image</Label><Input type="file" accept="image/png" onChange={e => setCoverImage(e.target.files?.[0] || null)} /></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schema">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Schema Content</CardTitle>
                        <CardDescription>Define the building blocks of your prompt.</CardDescription>
                    </div>
                    <AiGeneratorDialog onSchemaGenerated={handleAiSchemaGenerated} />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label>Prompt Template</Label>
                        <Textarea {...form.register('schema.promptTemplate')} placeholder="A portrait of a {race} {class}..." />
                        {form.formState.errors.schema?.promptTemplate && <p className="text-destructive text-sm mt-1">{form.formState.errors.schema.promptTemplate.message}</p>}
                    </div>

                    <Accordion type="multiple" className="w-full space-y-2">
                        {slotFields.map((slot, slotIndex) => (
                            <AccordionItem key={slot.id} value={slot.id} className="border-none">
                                <div className="bg-muted/50 p-4 rounded-lg border">
                                    <AccordionTrigger>
                                        <div className="flex items-center gap-2 w-full">
                                            <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                                            <div className="font-mono text-sm">{form.watch(`schema.slots.${slotIndex}.id`)}</div>
                                            <div className="text-muted-foreground">- {form.watch(`schema.slots.${slotIndex}.label`)}</div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-4">
                                        <SlotEditor control={form.control} slotIndex={slotIndex} removeSlot={removeSlot} />
                                    </AccordionContent>
                                </div>
                            </AccordionItem>
                        ))}
                    </Accordion>
                     {form.formState.errors.schema?.slots?.root && <p className="text-destructive text-sm mt-1">{form.formState.errors.schema.slots.root.message}</p>}

                    <Button type="button" variant="outline" onClick={() => appendSlot({ id: `new_slot_${slotFields.length}`, label: 'New Slot', type: 'select', options: [] })}>
                        <PlusCircle className="mr-2" /> Add Slot
                    </Button>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </form>
  );
}

// Sub-component for editing a single slot
function SlotEditor({ control, slotIndex, removeSlot }: { control: any, slotIndex: number, removeSlot: (index: number) => void }) {
    const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({
        control,
        name: `schema.slots.${slotIndex}.options`,
    });

    const isTextType = control.watch(`schema.slots.${slotIndex}.type`) === 'text';

    return (
        <div className="space-y-6 bg-background/50 p-4 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <Label>Slot ID</Label>
                    <Input {...control.register(`schema.slots.${slotIndex}.id`)} placeholder="e.g., armor_torso" />
                </div>
                <div>
                    <Label>Slot Label</Label>
                    <Input {...control.register(`schema.slots.${slotIndex}.label`)} placeholder="e.g., Torso Armor" />
                </div>
                 <div>
                    <Label>Type</Label>
                    <Controller
                        control={control}
                        name={`schema.slots.${slotIndex}.type`}
                        render={({ field }) => (
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="select">Select (List of Options)</SelectItem>
                                    <SelectItem value="text">Text (Free Input)</SelectItem>
                                </SelectContent>
                             </Select>
                        )}
                    />
                </div>
            </div>
            
            {isTextType ? (
                 <div>
                    <Label>Placeholder</Label>
                    <Input {...control.register(`schema.slots.${slotIndex}.placeholder`)} placeholder="e.g., Enter character name..." />
                </div>
            ) : (
                <>
                    <div>
                        <Label>Default Option Value</Label>
                        <Input {...control.register(`schema.slots.${slotIndex}.defaultOption`)} placeholder="e.g., leather_tunic" />
                    </div>

                    <div className="border-t pt-4 mt-4 space-y-2">
                        <Label className="text-base font-semibold">Options</Label>
                        {optionFields.map((option, optionIndex) => (
                            <div key={option.id} className="grid grid-cols-12 gap-2 p-2 border rounded-md bg-background">
                                <div className="col-span-5">
                                    <Label className="text-xs">Option Label</Label>
                                    <Input {...control.register(`schema.slots.${slotIndex}.options.${optionIndex}.label`)} placeholder="e.g., Leather Tunic" />
                                </div>
                                <div className="col-span-6">
                                    <Label className="text-xs">Option Value</Label>
                                    <Input {...control.register(`schema.slots.${slotIndex}.options.${optionIndex}.value`)} placeholder="e.g., leather_tunic" />
                                </div>
                                <div className="col-span-1 flex items-end">
                                    <Button type="button" variant="destructive" size="icon" onClick={() => removeOption(optionIndex)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        <Button type="button" size="sm" variant="secondary" onClick={() => appendOption({ label: '', value: '' })}>
                            <PlusCircle className="mr-2" /> Add Option
                        </Button>
                    </div>
                </>
            )}

            <div className="border-t pt-4 mt-4">
                <Button type="button" variant="destructive" size="sm" onClick={() => removeSlot(slotIndex)}>
                    Remove Slot
                </Button>
            </div>
        </div>
    )
}
