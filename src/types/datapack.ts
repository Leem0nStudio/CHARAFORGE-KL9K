

import { z } from 'zod';

// Base Interfaces for type-checking in TS
export interface Exclusion {
    slotId: string;
    optionValues: string[];
}

export interface Option {
    label: string;
    value: string;
    tags?: string[]; // Used for simple tag-based generation
    exclusions?: Exclusion[];
}

export interface Slot {
    id: string;
    label: string;
    type?: 'text' | 'select';
    options?: Option[];
    defaultOption?: string;
    placeholder?: string;
    isLocked?: boolean;
}

export interface PromptTemplate {
    name: string;
    template: string; // A full sentence template with {slot_id} placeholders
}

export interface DataPackSchema {
    promptTemplates: PromptTemplate[];
    slots: Slot[];
    tags?: string[];
}

export interface DataPack {
    id: string;
    name: string;
    author: string;
    description: string;
    coverImageUrl: string | null;
    type: 'free' | 'premium' | 'temporal';
    price: number;
    tags: string[];
    createdAt: number;
    updatedAt?: number | null;
    schema: DataPackSchema;
    isNsfw?: boolean;
}

// Zod Schemas for validation (both client and server)

export const ExclusionSchema = z.object({
    slotId: z.string().min(1, 'Target Slot ID is required.'),
    optionValues: z.array(z.string()).min(1, 'At least one option value is required.'),
});

export const OptionSchema = z.object({
    label: z.string().min(1, 'Label is required.'),
    value: z.string().min(1, 'Value is required.'),
    tags: z.array(z.string()).optional(),
    exclusions: z.array(ExclusionSchema).optional(),
});

export const SlotSchema = z.object({
    id: z.string().min(1, 'ID is required.'),
    label: z.string().min(1, 'Label is required.'),
    type: z.enum(['text', 'select']).default('select'),
    options: z.array(OptionSchema).optional(),
    defaultOption: z.string().optional(),
    placeholder: z.string().optional(),
    isLocked: z.boolean().optional(),
});

export const PromptTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required.'),
  template: z.string().min(1, 'Template string is required.'),
});


export const DataPackSchemaSchema = z.object({
    promptTemplates: z.array(PromptTemplateSchema).min(1, 'At least one prompt template is required.'),
    slots: z.array(SlotSchema).min(1, 'At least one slot is required.'),
    tags: z.array(z.string()).optional(),
});

// Used for the entire form in the admin panel
export const DataPackFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  author: z.string().min(1, 'Author is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['free', 'premium', 'temporal']),
  price: z.number().min(0),
  tags: z.array(z.string()).optional(),
  schema: DataPackSchemaSchema,
  isNsfw: z.boolean().optional(),
});

// Used for the server action (upsert)
export const UpsertDataPackSchema = DataPackFormSchema.extend({
    id: z.string().optional(),
});

// TypeScript types inferred from Zod schemas
export type DataPackFormValues = z.infer<typeof DataPackFormSchema>;
export type UpsertDataPack = z.infer<typeof UpsertDataPackSchema>;
