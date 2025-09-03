
'use client';

import { useFormContext, Controller, useFieldArray } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { DataPackFormValues } from '@/types/datapack';
import { Loader2, Trash2, PlusCircle, Sprout } from 'lucide-react';
import { cn } from '@/lib/utils';


function OptionEditor({ control, namePrefix }: { control: any, namePrefix: string }) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: namePrefix
    });

    return (
        <div className="space-y-2">
            {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center bg-background p-2 rounded-md">
                    <Controller
                        name={`${namePrefix}.${index}.label`}
                        control={control}
                        render={({ field }) => <Input {...field} placeholder="Label (UI)" />}
                    />
                     <Controller
                        name={`${namePrefix}.${index}.value`}
                        control={control}
                        render={({ field }) => <Input {...field} placeholder="Value (Prompt)" />}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                        <Trash2 className="text-destructive"/>
                    </Button>
                </div>
            ))}
             <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ label: '', value: '' })}
            >
                <PlusCircle className="mr-2" /> Add Option
            </Button>
        </div>
    );
}

function DynamicSlotEditor({ control }: { control: any }) {
    const { getValues } = useFormContext<DataPackFormValues>();
    const profileSchema = getValues('schema.characterProfileSchema');

    // Filter out keys that are actually templates, not option lists
    const slotKeys = Object.keys(profileSchema || {}).filter(key => 
        Array.isArray((profileSchema as any)[key])
    );

    if (slotKeys.length === 0) {
        return <p className="text-muted-foreground text-sm p-4 text-center">No option slots found. Import a file or use the AI Assistant to populate the schema.</p>;
    }
    
    return (
         <Accordion type="multiple" className="w-full space-y-2">
            {slotKeys.map(slotKey => (
                 <AccordionItem key={slotKey} value={slotKey}>
                    <AccordionTrigger className="text-base font-semibold border bg-muted/50 px-4 rounded-md capitalize">
                        {slotKey.replace(/_/g, ' ')}
                    </AccordionTrigger>
                    <AccordionContent className="p-4 border rounded-b-md">
                        <OptionEditor
                            control={control}
                            namePrefix={`schema.characterProfileSchema.${slotKey}`}
                        />
                    </AccordionContent>
                </AccordionItem>
            ))}
         </Accordion>
    );
}


export function DataPackSchemaEditor({ form, isAiGenerating }: { 
    form: ReturnType<typeof useFormContext<DataPackFormValues>>,
    isAiGenerating: boolean,
}) {
  const { control } = form;
  const { fields: templateFields, append: appendTemplate, remove: removeTemplate } = useFieldArray({
      control,
      name: "schema.promptTemplates",
  });
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
           <CardTitle className={cn("transition-colors", isAiGenerating && "text-primary")}>
             Schema Content
           </CardTitle>
           {isAiGenerating && <Loader2 className="animate-spin text-primary" />}
        </div>
        <CardDescription>
            Define the building blocks for your DataPack.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="space-y-4 p-4 border rounded-md">
            <h3 className="font-semibold text-lg flex items-center gap-2"><Sprout className="text-primary"/> Prompt Templates</h3>
            <div className="space-y-2">
                 {templateFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-[1fr_auto] gap-2 items-end">
                        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2">
                            <Input
                                {...control.register(`schema.promptTemplates.${index}.name`)}
                                placeholder="Template Name (e.g., Portrait)"
                            />
                            <Input
                                {...control.register(`schema.promptTemplates.${index}.template`)}
                                placeholder="e.g., A portrait of a {raceClass}..."
                            />
                        </div>
                        <Button type="button" variant="destructive" size="icon" onClick={() => removeTemplate(index)}>
                            <Trash2 />
                        </Button>
                    </div>
                ))}
            </div>
             <Button
                type="button"
                variant="outline"
                onClick={() => appendTemplate({ name: '', template: '' })}
            >
                Add Template
            </Button>
        </div>

        <div className="space-y-4 p-4 border rounded-md">
            <h3 className="font-semibold text-lg">Option Slots</h3>
            <p className="text-sm text-muted-foreground">
                These slots were automatically generated from your imported file or by the AI.
            </p>
            <div className="mt-4">
                <DynamicSlotEditor control={control} />
            </div>
        </div>

      </CardContent>
    </Card>
  );
}
