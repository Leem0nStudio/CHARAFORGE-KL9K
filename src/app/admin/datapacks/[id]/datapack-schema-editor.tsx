
'use client';

import { useFormContext, Controller, useFieldArray } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { DataPackFormValues, DataPackSchema } from '@/types/datapack';
import { AiGeneratorDialog } from './ai-generator-dialog';
import { Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper function to render a textarea for a given field in the schema
function JsonOptionEditor({ control, name, label, placeholder }: {
    control: any;
    name: any;
    label: string;
    placeholder: string;
}) {
    return (
        <div className="space-y-1">
            <Label htmlFor={name} className="font-mono text-xs">{label}</Label>
            <Controller
                name={name}
                control={control}
                render={({ field }) => {
                    const valueAsString = typeof field.value === 'string' 
                        ? field.value 
                        : (field.value ? JSON.stringify(field.value, null, 2) : '');
                    
                    return (
                        <Textarea
                            id={name}
                            className="min-h-24 font-mono text-xs"
                            placeholder={placeholder}
                            value={valueAsString}
                            onChange={(e) => {
                                try {
                                    const parsed = JSON.parse(e.target.value);
                                    field.onChange(parsed);
                                } catch (error) {
                                    // If JSON is invalid, just update the string value for now
                                    field.onChange(e.target.value);
                                }
                            }}
                        />
                    )
                }}
            />
        </div>
    );
}

// Helper to render the multiple equipment slots inside an accordion
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
                    <AccordionContent className="p-4 border rounded-b-md">
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <JsonOptionEditor
                                control={control}
                                name={`schema.characterProfileSchema.${slotName}.clothing`}
                                label="Clothing"
                                placeholder={`[{"label": "T-Shirt", "value": "wearing a t-shirt"}]`}
                            />
                            <JsonOptionEditor
                                control={control}
                                name={`schema.characterProfileSchema.${slotName}.armor`}
                                label="Armor"
                                placeholder={`[{"label": "Leather Armor", "value": "wearing leather armor"}]`}
                            />
                             <JsonOptionEditor
                                control={control}
                                name={`schema.characterProfileSchema.${slotName}.accessory`}
                                label="Accessory"
                                placeholder={`[{"label": "Necklace", "value": "wearing a necklace"}]`}
                            />
                             <JsonOptionEditor
                                control={control}
                                name={`schema.characterProfileSchema.${slotName}.weapon`}
                                label="Weapon"
                                placeholder={`[{"label": "Sword", "value": "wielding a sword"}]`}
                            />
                        </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );
}

export function DataPackSchemaEditor({ form, onAiSchemaGenerated, isAiGenerating, onAiGeneratingChange }: { 
    form: ReturnType<typeof useFormContext<DataPackFormValues>>,
    onAiSchemaGenerated: (schema: DataPackSchema, tags: string[]) => void,
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
        <AiGeneratorDialog onSchemaGenerated={onAiSchemaGenerated} onGeneratingChange={onAiGeneratingChange} />
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
          <div className="grid md:grid-cols-3 gap-4">
            <JsonOptionEditor control={control} name="schema.characterProfileSchema.count" label="Count" placeholder='[{"label": "1 Girl", "value": "1girl"}]' />
            <JsonOptionEditor control={control} name="schema.characterProfileSchema.raceClass" label="Race/Class" placeholder='[{"label": "Elf Warrior", "value": "elf warrior"}]' />
            <JsonOptionEditor control={control} name="schema.characterProfileSchema.gender" label="Gender" placeholder='[{"label": "Female", "value": "female"}]' />
          </div>
        </div>

        {/* Appearance Section */}
        <div className="space-y-4 p-4 border rounded-md">
          <h3 className="font-semibold text-lg">Appearance</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <JsonOptionEditor control={control} name="schema.characterProfileSchema.hair" label="Hair" placeholder='[{"label": "Long Hair", "value": "long hair"}]' />
            <JsonOptionEditor control={control} name="schema.characterProfileSchema.eyes" label="Eyes" placeholder='[{"label": "Blue Eyes", "value": "blue eyes"}]' />
            <JsonOptionEditor control={control} name="schema.characterProfileSchema.skin" label="Skin" placeholder='[{"label": "Pale Skin", "value": "pale skin"}]' />
            <JsonOptionEditor control={control} name="schema.characterProfileSchema.facialFeatures" label="Facial Features" placeholder='[{"label": "Freckles", "value": "freckles"}]' />
          </div>
        </div>
        
        {/* Equipment Section */}
         <div className="space-y-4 p-4 border rounded-md">
            <h3 className="font-semibold text-lg">Equipment Slots</h3>
            <EquipmentSlotAccordion control={control} />
        </div>

        {/* Scene Section */}
        <div className="space-y-4 p-4 border rounded-md">
          <h3 className="font-semibold text-lg">Scene & Action</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
             <JsonOptionEditor control={control} name="schema.characterProfileSchema.weaponsExtra" label="Extra Weapons" placeholder='[{"label": "Dagger", "value": "dagger"}]' />
             <JsonOptionEditor control={control} name="schema.characterProfileSchema.pose" label="Pose" placeholder='[{"label": "Standing", "value": "standing"}]' />
             <JsonOptionEditor control={control} name="schema.characterProfileSchema.action" label="Action" placeholder='[{"label": "Holding Sword", "value": "holding sword"}]' />
             <JsonOptionEditor control={control} name="schema.characterProfileSchema.camera" label="Camera" placeholder='[{"label": "Full Body", "value": "full body"}]' />
             <JsonOptionEditor control={control} name="schema.characterProfileSchema.background" label="Background" placeholder='[{"label": "Forest", "value": "forest"}]' />
             <JsonOptionEditor control={control} name="schema.characterProfileSchema.effects" label="Effects" placeholder='[{"label": "Glowing Aura", "value": "glowing aura"}]' />
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
