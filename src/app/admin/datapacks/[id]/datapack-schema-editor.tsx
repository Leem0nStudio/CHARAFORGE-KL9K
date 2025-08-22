
'use client';

import { useFormContext, Controller } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { DataPackFormValues, DataPackSchema, CharacterProfileSchema } from '@/types/datapack';
import { AiGeneratorDialog } from './ai-generator-dialog';

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
                render={({ field }) => (
                    <Textarea
                        id={name}
                        className="min-h-24 font-mono text-xs"
                        placeholder={placeholder}
                        {...field}
                        // The data is an object, so we need to stringify/parse it
                        value={field.value ? JSON.stringify(field.value, null, 2) : ''}
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
                )}
            />
        </div>
    );
}

// Helper to render the multiple equipment slots inside an accordion
function EquipmentSlotAccordion({ control }: { control: any }) {
    const equipmentSlots: Array<keyof CharacterProfileSchema> = ['head', 'face', 'neck', 'shoulders', 'torso', 'arms', 'hands', 'waist', 'legs', 'feet', 'back'];

    return (
        <Accordion type="multiple" className="w-full space-y-2">
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
                                placeholder={`[\n  {\n    "label": "T-Shirt",\n    "value": "wearing a t-shirt"\n  }\n]`}
                            />
                            <JsonOptionEditor
                                control={control}
                                name={`schema.characterProfileSchema.${slotName}.armor`}
                                label="Armor"
                                placeholder={`[\n  {\n    "label": "Leather Armor",\n    "value": "wearing leather armor"\n  }\n]`}
                            />
                             <JsonOptionEditor
                                control={control}
                                name={`schema.characterProfileSchema.${slotName}.accessory`}
                                label="Accessory"
                                placeholder={`[\n  {\n    "label": "Necklace",\n    "value": "wearing a necklace"\n  }\n]`}
                            />
                             <JsonOptionEditor
                                control={control}
                                name={`schema.characterProfileSchema.${slotName}.weapon`}
                                label="Weapon"
                                placeholder={`[\n  {\n    "label": "Sword",\n    "value": "wielding a sword"\n  }\n]`}
                            />
                        </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );
}


export function DataPackSchemaEditor({ form }: { form: ReturnType<typeof useFormContext<DataPackFormValues>> }) {
  const { control, setValue, getValues } = form;

  const handleAiSchemaGenerated = (generatedSchema: Partial<DataPackSchema>) => {
    // When the AI generates a schema, it might be incomplete. We merge it with the existing one.
    const currentSchema = getValues('schema.characterProfileSchema') || {};
    const newSchema = { ...currentSchema, ...generatedSchema.characterProfileSchema };
    
    setValue('schema.characterProfileSchema', newSchema, { shouldValidate: true, shouldDirty: true });
    
    if (generatedSchema.tags) {
        setValue('tags', generatedSchema.tags, { shouldValidate: true, shouldDirty: true });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Schema Content</CardTitle>
          <CardDescription>Define the building blocks of your prompt using the new granular system.</CardDescription>
        </div>
        <AiGeneratorDialog onSchemaGenerated={handleAiSchemaGenerated} />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* General Section */}
        <div className="space-y-4 p-4 border rounded-md">
          <h3 className="font-semibold text-lg">General</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <JsonOptionEditor control={control} name="schema.characterProfileSchema.count" label="Count" placeholder='e.g., [{"label": "1 Girl", "value": "1girl"}]' />
            <JsonOptionEditor control={control} name="schema.characterProfileSchema.raceClass" label="Race/Class" placeholder='e.g., [{"label": "Elf Warrior", "value": "elf warrior"}]' />
            <JsonOptionEditor control={control} name="schema.characterProfileSchema.gender" label="Gender" placeholder='e.g., [{"label": "Female", "value": "female"}]' />
          </div>
        </div>

        {/* Appearance Section */}
        <div className="space-y-4 p-4 border rounded-md">
          <h3 className="font-semibold text-lg">Appearance</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <JsonOptionEditor control={control} name="schema.characterProfileSchema.hair" label="Hair" placeholder='e.g., [{"label": "Long Hair", "value": "long hair"}]' />
            <JsonOptionEditor control={control} name="schema.characterProfileSchema.eyes" label="Eyes" placeholder='e.g., [{"label": "Blue Eyes", "value": "blue eyes"}]' />
            <JsonOptionEditor control={control} name="schema.characterProfileSchema.skin" label="Skin" placeholder='e.g., [{"label": "Pale Skin", "value": "pale skin"}]' />
            <JsonOptionEditor control={control} name="schema.characterProfileSchema.facialFeatures" label="Facial Features" placeholder='e.g., [{"label": "Freckles", "value": "freckles"}]' />
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
             <JsonOptionEditor control={control} name="schema.characterProfileSchema.weaponsExtra" label="Extra Weapons" placeholder='e.g., [{"label": "Dagger", "value": "dagger"}]' />
             <JsonOptionEditor control={control} name="schema.characterProfileSchema.pose" label="Pose" placeholder='e.g., [{"label": "Standing", "value": "standing"}]' />
             <JsonOptionEditor control={control} name="schema.characterProfileSchema.action" label="Action" placeholder='e.g., [{"label": "Holding Sword", "value": "holding sword"}]' />
             <JsonOptionEditor control={control} name="schema.characterProfileSchema.camera" label="Camera" placeholder='e.g., [{"label": "Full Body", "value": "full body"}]' />
             <JsonOptionEditor control={control} name="schema.characterProfileSchema.background" label="Background" placeholder='e.g., [{"label": "Forest", "value": "forest"}]' />
             <JsonOptionEditor control={control} name="schema.characterProfileSchema.effects" label="Effects" placeholder='e.g., [{"label": "Glowing Aura", "value": "glowing aura"}]' />
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
