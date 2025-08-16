
'use client';

import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { PlusCircle, Trash2 } from 'lucide-react';
import type { DataPackFormValues } from '@/types/datapack';

interface SlotEditorProps {
    form: ReturnType<typeof useFormContext<DataPackFormValues>>;
    slotIndex: number;
    removeSlot: (index: number) => void;
}

export function SlotEditor({ form, slotIndex, removeSlot }: SlotEditorProps) {
    const { control, register, watch } = form;

    const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({
        control,
        name: `schema.slots.${slotIndex}.options`,
    });

    const isTextType = watch(`schema.slots.${slotIndex}.type`) === 'text';

    return (
        <div className="space-y-6 bg-background/50 p-4 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <Label>Slot ID</Label>
                    <Input {...register(`schema.slots.${slotIndex}.id`)} placeholder="e.g., armor_torso" />
                </div>
                <div>
                    <Label>Slot Label</Label>
                    <Input {...register(`schema.slots.${slotIndex}.label`)} placeholder="e.g., Torso Armor" />
                </div>
                 <div>
                    <Label>Type</Label>
                    <Controller
                        control={control}
                        name={`schema.slots.${slotIndex}.type`}
                        render={({ field }) => (
                             <Select onValueChange={field.onChange} value={field.value}>
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
                    <Input {...register(`schema.slots.${slotIndex}.placeholder`)} placeholder="e.g., Enter character name..." />
                </div>
            ) : (
                <>
                    <div>
                        <Label>Default Option Value</Label>
                        <Input {...register(`schema.slots.${slotIndex}.defaultOption`)} placeholder="e.g., leather_tunic" />
                    </div>

                    <div className="border-t pt-4 mt-4 space-y-2">
                        <Label className="text-base font-semibold">Options</Label>
                        {optionFields.map((option, optionIndex) => (
                            <div key={option.id} className="grid grid-cols-12 gap-2 p-2 border rounded-md bg-background">
                                <div className="col-span-5">
                                    <Label className="text-xs">Option Label</Label>
                                    <Input {...register(`schema.slots.${slotIndex}.options.${optionIndex}.label`)} placeholder="e.g., Leather Tunic" />
                                </div>
                                <div className="col-span-6">
                                    <Label className="text-xs">Option Value</Label>
                                    <Input {...register(`schema.slots.${slotIndex}.options.${optionIndex}.value`)} placeholder="e.g., leather_tunic" />
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
                 <Controller
                    control={control}
                    name={`schema.slots.${slotIndex}.isLocked`}
                    render={({ field }) => (
                      <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm bg-background">
                        <div className="space-y-0.5">
                            <Label htmlFor={`isLocked-switch-${slotIndex}`}>Lock this slot</Label>
                             <p className="text-xs text-muted-foreground">If locked, users cannot change this value.</p>
                        </div>
                        <Switch
                            id={`isLocked-switch-${slotIndex}`}
                            checked={!!field.value}
                            onCheckedChange={field.onChange}
                        />
                      </div>
                    )}
                  />
            </div>

            <div className="border-t pt-4 mt-4">
                <Button type="button" variant="destructive" size="sm" onClick={() => removeSlot(slotIndex)}>
                    Remove Slot
                </Button>
            </div>
        </div>
    );
}

    