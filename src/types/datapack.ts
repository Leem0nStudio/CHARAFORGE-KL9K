
import { z } from 'zod';

// #region New Granular RPG Schema

/**
 * Represents the different types of gear that can be equipped in a single body slot.
 */
export type EquipmentOption = { label: string; value: string };

export interface EquipmentSlotOptions {
  clothing?: EquipmentOption[];
  armor?: EquipmentOption[];
  accessory?: EquipmentOption[];
  weapon?: EquipmentOption[];
}

/**
 * Defines the available options for each part of a structured character profile.
 */
export interface CharacterProfileSchema {
  // General
  count?: EquipmentOption[];
  raceClass?: EquipmentOption[];
  gender?: EquipmentOption[];

  // Appearance
  hair?: EquipmentOption[];
  eyes?: EquipmentOption[];
  skin?: EquipmentOption[];
  facialFeatures?: EquipmentOption[];

  // Equipment Slots
  head?: EquipmentSlotOptions;
  face?: EquipmentSlotOptions;
  neck?: EquipmentSlotOptions;
  shoulders?: EquipmentSlotOptions;
  torso?: EquipmentSlotOptions;
  arms?: EquipmentSlotOptions;
  hands?: EquipmentSlotOptions;
  waist?: EquipmentSlotOptions;
  legs?: EquipmentSlotOptions;
  feet?: EquipmentSlotOptions;
  back?: EquipmentSlotOptions;

  // Extra weapons
  weaponsExtra?: EquipmentOption[];

  // Scene
  pose?: EquipmentOption[];
  action?: EquipmentOption[];
  camera?: EquipmentOption[];
  background?: EquipmentOption[];
  effects?: EquipmentOption[];
}

// #endregion


// Base Interfaces for type-checking in TS
export interface Exclusion {
    slotId: string;
    optionValues: string[];
}

export interface Option {
    label: string;
    value: string;
    tags?: string[];
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
    template: string;
}

/**
 * The main schema for a DataPack, now supporting both old and new systems.
 */
export interface DataPackSchema {
    // Legacy system (to be deprecated)
    slots?: Slot[];
    
    // New RPG Inventory system
    characterProfileSchema?: Partial<CharacterProfileSchema>;
    
    // Common fields
    promptTemplates?: PromptTemplate[];
    tags?: string[];
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
}

// Zod Schemas for validation (both client and server)

const EquipmentOptionSchema = z.object({
  label: z.string(),
  value: z.string(),
});

const EquipmentSlotOptionsSchema = z.object({
  clothing: z.array(EquipmentOptionSchema).optional(),
  armor: z.array(EquipmentOptionSchema).optional(),
  accessory: z.array(EquipmentOptionSchema).optional(),
  weapon: z.array(EquipmentOptionSchema).optional(),
}).optional();

const CharacterProfileSchemaForZod = z.object({
  count: z.array(EquipmentOptionSchema).optional(),
  raceClass: z.array(EquipmentOptionSchema).optional(),
  gender: z.array(EquipmentOptionSchema).optional(),
  hair: z.array(EquipmentOptionSchema).optional(),
  eyes: z.array(EquipmentOptionSchema).optional(),
  skin: z.array(EquipmentOptionSchema).optional(),
  facialFeatures: z.array(EquipmentOptionSchema).optional(),
  head: EquipmentSlotOptionsSchema,
  face: EquipmentSlotOptionsSchema,
  neck: EquipmentSlotOptionsSchema,
  shoulders: EquipmentSlotOptionsSchema,
  torso: EquipmentSlotOptionsSchema,
  arms: EquipmentSlotOptionsSchema,
  hands: EquipmentSlotOptionsSchema,
  waist: EquipmentSlotOptionsSchema,
  legs: EquipmentSlotOptionsSchema,
  feet: EquipmentSlotOptionsSchema,
  back: EquipmentSlotOptionsSchema,
  weaponsExtra: z.array(EquipmentOptionSchema).optional(),
  pose: z.array(EquipmentOptionSchema).optional(),
  action: z.array(EquipmentOptionSchema).optional(),
  camera: z.array(EquipmentOptionSchema).optional(),
  background: z.array(EquipmentOptionSchema).optional(),
  effects: z.array(EquipmentOptionSchema).optional(),
}).passthrough().optional();


export const DataPackSchemaSchema = z.object({
    promptTemplates: z.array(z.object({
        name: z.string(),
        template: z.string(),
    })).optional(),
    characterProfileSchema: CharacterProfileSchemaForZod,
    tags: z.array(z.string()).optional(),
}).optional();

export const DataPackFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  author: z.string().min(1, 'Author is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['free', 'premium', 'temporal']),
  price: z.number().min(0),
  tags: z.array(z.string()).optional(),
  schema: DataPackSchemaSchema.default({ characterProfileSchema: {} }),
  isNsfw: z.boolean().optional(),
});


export const UpsertDataPackSchema = DataPackFormSchema.extend({
    id: z.string().optional(),
});

export type DataPackFormValues = z.infer<typeof DataPackFormSchema>;
export type UpsertDataPack = z.infer<typeof UpsertDataPackSchema>;
