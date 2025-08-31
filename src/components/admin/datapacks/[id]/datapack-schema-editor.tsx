
'use client';

import { useFormContext, Controller, useFieldArray } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { DataPackFormValues, DataPackSchema } from '@/types/datapack';
// import { AiGeneratorDialog } from './ai-generator-dialog'; // TODO: Import when file exists
import { Loader2, Trash2, Wand2, PlusCircle } from 'lucide-react';
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


function EquipmentSlotAccordion({ control }: { control: any }) {
    const equipmentSlots: Array<keyof Omit<DataPackFormValues['schema']['characterProfileSchema'], 'count' | 'raceClass' | 'gender' | 'hair' | 'eyes' | 'skin' | 'facialFeatures' | 'weaponsExtra' | 'pose' | 'action' | 'camera' | 'background' | 'effects'>> = 
        ['head', 'face', 'neck', 'shoulders', 'torso', 'arms', 'hands', 'waist', 'legs', 'feet', 'back'];

    return (
        <Accordion type="multiple" className="w-full space-y-2" defaultValue={['torso', 'hands', 'feet']}>
            {equipmentSlots.map(slotName => (
                <AccordionItem key={slotName} value={slotName}>
                    <AccordionTrigger className="capitalize text-base font-semibold border bg-muted/50 px-4 rounded-md">
                        {slotName}
                    </AccordionTrigger>
                    <AccordionContent className="p-4 border rounded-b-md space-y-4">
                       <div className="space-y-1"><Label className="font-mono text-xs">Clothing</Label><OptionEditor control={control} namePrefix={`schema.characterProfileSchema.${slotName}.clothing`} /></div>
                       <div className="space-y-1"><Label className="font-mono text-xs">Armor</Label><OptionEditor control={control} namePrefix={`schema.characterProfileSchema.${slotName}.armor`} /></div>
                       <div className="space-y-1"><Label className="font-mono text-xs">Accessory</Label><OptionEditor control={control} namePrefix={`schema.characterProfileSchema.${slotName}.accessory`} /></div>
                       <div className="space-y-1"><Label className="font-mono text-xs">Weapon</Label><OptionEditor control={control} namePrefix={`schema.characterProfileSchema.${slotName}.weapon`} /></div>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );
}

export function DataPackSchemaEditor({ form, onAiSchemaGenerated, isAiGenerating, onAiGeneratingChange }: { 
    form: ReturnType<typeof useFormContext<DataPackFormValues>>,
    onAiSchemaGenerated: (schema: DataPackSchema, name: string, description: string, tags: string[]) => void,
    isAiGenerating: boolean,
    onAiGeneratingChange: (isGenerating: boolean) => void,
}) {
  const { control } = form;
  const { fields, append, remove } = useFieldArray({
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
        {/* <AiGeneratorDialog onSchemaGenerated={onAiSchemaGenerated} onGeneratingChange={onAiGeneratingChange} /> */}
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Prompt Templates Section */}
        <div className="space-y-4 p-4 border rounded-md">
            <h3 className="font-semibold text-lg">Prompt Templates</h3>
            <div className="space-y-2">
                 {fields.map((field, index) => (
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
                        <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                            <Trash2 />
                        </Button>
                    </div>
                ))}
            </div>
             <Button
                type="button"
                variant="outline"
                onClick={() => append({ name: '', template: '' })}
            >
                Add Template
            </Button>
        </div>

        {/* General Section */}
        <div className="space-y-4 p-4 border rounded-md">
          <h3 className="font-semibold text-lg">General</h3>
           <div className="space-y-1"><Label>Count</Label><OptionEditor control={control} namePrefix="schema.characterProfileSchema.count" /></div>
           <div className="space-y-1"><Label>Race/Class</Label><OptionEditor control={control} namePrefix="schema.characterProfileSchema.raceClass" /></div>
        </div>

        {/* Appearance Section */}
        <div className="space-y-4 p-4 border rounded-md">
          <h3 className="font-semibold text-lg">Appearance</h3>
           <div className="space-y-1"><Label>Gender</Label><OptionEditor control={control} namePrefix="schema.characterProfileSchema.gender" /></div>
           <div className="space-y-1"><Label>Hair</Label><OptionEditor control={control} namePrefix="schema.characterProfileSchema.hair" /></div>
           <div className="space-y-1"><Label>Eyes</Label><OptionEditor control={control} namePrefix="schema.characterProfileSchema.eyes" /></div>
           <div className="space-y-1"><Label>Skin</Label><OptionEditor control={control} namePrefix="schema.characterProfileSchema.skin" /></div>
           <div className="space-y-1"><Label>Facial Features</Label><OptionEditor control={control} namePrefix="schema.characterProfileSchema.facialFeatures" /></div>
        </div>
        
        {/* Equipment Section */}
         <div className="space-y-4 p-4 border rounded-md">
            <h3 className="font-semibold text-lg">Equipment Slots</h3>
            <EquipmentSlotAccordion control={control} />
        </div>

        {/* Scene Section */}
        <div className="space-y-4 p-4 border rounded-md">
          <h3 className="font-semibold text-lg">Scene & Action</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1"><Label>Extra Weapons</Label><OptionEditor control={control} namePrefix="schema.characterProfileSchema.weaponsExtra" /></div>
            <div className="space-y-1"><Label>Pose</Label><OptionEditor control={control} namePrefix="schema.characterProfileSchema.pose" /></div>
            <div className="space-y-1"><Label>Action</Label><OptionEditor control={control} namePrefix="schema.characterProfileSchema.action" /></div>
            <div className="space-y-1"><Label>Camera</Label><OptionEditor control={control} namePrefix="schema.characterProfileSchema.camera" /></div>
            <div className="space-y-1"><Label>Background</Label><OptionEditor control={control} namePrefix="schema.characterProfileSchema.background" /></div>
            <div className="space-y-1"><Label>Effects</Label><OptionEditor control={control} namePrefix="schema.characterProfileSchema.effects" /></div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
