
'use client';

import { useFormContext, useFieldArray } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionItem, AccordionContent, AccordionTrigger } from '@/components/ui/accordion';
import { PlusCircle, GripVertical } from 'lucide-react';
import type { DataPackFormValues, DataPackSchema } from '@/types/datapack';
import { SlotEditor } from './slot-editor';
import { AiGeneratorDialog } from './ai-generator-dialog';


interface DataPackSchemaEditorProps {
    form: ReturnType<typeof useFormContext<DataPackFormValues>>;
}

export function DataPackSchemaEditor({ form }: DataPackSchemaEditorProps) {
  const { control, register, setValue, formState: { errors } } = form;

  const { fields: slotFields, append: appendSlot, remove: removeSlot } = useFieldArray({
    control,
    name: "schema.slots",
  });
  
  const handleAiSchemaGenerated = (generatedSchema: DataPackSchema) => {
    // setValue can update nested objects directly
    setValue('schema', generatedSchema, { shouldValidate: true, shouldDirty: true });
    // The `tags` field is part of the metadata form, but the AI generates it.
    // So we update it here as well.
    setValue('tags', generatedSchema.tags || [], { shouldValidate: true, shouldDirty: true });
  };

  return (
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
                <Textarea {...register('schema.promptTemplate')} placeholder="A portrait of a {race} {class}..." />
                {errors.schema?.promptTemplate && <p className="text-destructive text-sm mt-1">{errors.schema.promptTemplate.message}</p>}
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
                                <SlotEditor form={form} slotIndex={slotIndex} removeSlot={removeSlot} />
                            </AccordionContent>
                        </div>
                    </AccordionItem>
                ))}
            </Accordion>
            {errors.schema?.slots?.root && <p className="text-destructive text-sm mt-1">{errors.schema.slots.root.message}</p>}

            <Button type="button" variant="outline" onClick={() => appendSlot({ id: `new_slot_${slotFields.length}`, label: 'New Slot', type: 'select', options: [] })}>
                <PlusCircle className="mr-2" /> Add Slot
            </Button>
        </CardContent>
    </Card>
  );
}

    