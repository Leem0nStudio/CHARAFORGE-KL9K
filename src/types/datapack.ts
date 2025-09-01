
import { z } from 'zod';

export interface Option {
    label: string;
    value: string;
    rarity?: number; // Added for weighted selection
}

export interface PromptTemplate {
    name: string;
    template: string;
}

export interface EquipmentSlotOptions {
    clothing?: Option[];
    armor?: Option[];
    accessory?: Option[];
    weapon?: Option[];
}

/**
 * The main schema for a DataPack. The characterProfileSchema can have any string as a key,
 * representing a "slot" (e.g., 'hair_color', 'clothing_style'). The value can be an array
 * of simple options, or a nested object for equipment slots.
 */
export type CharacterProfileSchema = {
    [key: string]: Option[] | EquipmentSlotOptions | undefined;
};


export interface DataPackSchema {
    promptTemplates: PromptTemplate[];
    characterProfileSchema: CharacterProfileSchema;
}

export interface DataPack {
    id: string;
    name:string;
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
    extends?: string[];
    includes?: string[];
    imported?: boolean;
}

// Zod Schemas for validation

const OptionSchema = z.object({
  label: z.string(),
  value: z.string(),
  rarity: z.number().optional(),
});

const EquipmentSlotOptionsSchema = z.object({
    clothing: z.array(OptionSchema).optional(),
    armor: z.array(OptionSchema).optional(),
    accessory: z.array(OptionSchema).optional(),
    weapon: z.array(OptionSchema).optional(),
}).optional();

const PromptTemplateSchema = z.object({
    name: z.string(),
    template: z.string(),
});

// A dynamic schema for character profiles where keys are strings and values are arrays of options or equipment objects.
const CharacterProfileSchemaForZod = z.record(
    z.string(), 
    z.union([z.array(OptionSchema), EquipmentSlotOptionsSchema])
);

export const DataPackSchemaSchema = z.object({
    promptTemplates: z.array(PromptTemplateSchema).default([]),
    characterProfileSchema: CharacterProfileSchemaForZod.default({}),
});

export const DataPackFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  author: z.string().min(1, 'Author is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['free', 'premium', 'temporal']),
  price: z.number().min(0),
  tags: z.array(z.string()).optional(),
  schema: DataPackSchemaSchema,
  isNsfw: z.boolean().optional(),
  extends: z.array(z.string()).optional(),
  includes: z.array(z.string()).optional(),
  imported: z.boolean().optional(),
});


export const UpsertDataPackSchema = DataPackFormSchema.extend({
    id: z.string().optional(),
});

export type DataPackFormValues = z.infer<typeof DataPackFormSchema>;
export type UpsertDataPack = z.infer<typeof UpsertDataPackSchema>;
