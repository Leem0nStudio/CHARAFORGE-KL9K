
import { z } from 'zod';

// Base Interfaces for type-checking in TS
export interface Exclusion {
    slotId: string;
    optionValues: string[];
}

export interface Option {
    label: string;
    value: string;
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

export interface DataPackSchema {
    promptTemplate: string;
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
}

// Zod Schemas for validation (both client and server)

export const ExclusionSchema = z.object({
    slotId: z.string().min(1, 'Target Slot ID is required.'),
    optionValues: z.array(z.string()).min(1, 'At least one option value is required.'),
});

export const OptionSchema = z.object({
    label: z.string().min(1, 'Label is required.'),
    value: z.string().min(1, 'Value is required.'),
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

export const DataPackSchemaSchema = z.object({
    promptTemplate: z.string().min(1, 'Prompt template is required.'),
    slots: z.array(SlotSchema).min(1, 'At least one slot is required.'),
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
});

// Used for the server action (upsert)
export const UpsertDataPackSchema = DataPackFormSchema.extend({
    id: z.string().optional(),
});

// TypeScript types inferred from Zod schemas
export type DataPackFormValues = z.infer<typeof DataPackFormSchema>;
export type UpsertDataPack = z.infer<typeof UpsertDataPackSchema>;
