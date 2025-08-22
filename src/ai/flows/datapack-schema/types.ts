
/**
 * @fileOverview Data schemas and types for the DataPack schema generation flow.
 * This file defines the Zod schemas for input and output validation,
 * and exports the corresponding TypeScript types. Now updated to support
 * the new granular CharacterProfileSchema.
 */

import { z } from 'zod';

export const GenerateDataPackSchemaInputSchema = z.object({
  concept: z.string().describe('The core concept or theme for the DataPack (e.g., "cyberpunk space pirates", "lovecraftian horror investigators").'),
});
export type GenerateDataPackSchemaInput = z.infer<typeof GenerateDataPackSchemaInputSchema>;


// Define Zod schemas that match the new types in src/types/datapack.ts
const OptionObjectSchema = z.object({
    label: z.string(),
    value: z.string(),
});

const EquipmentSlotOptionsSchema = z.object({
    clothing: z.array(OptionObjectSchema).optional(),
    armor: z.array(OptionObjectSchema).optional(),
    accessory: z.array(OptionObjectSchema).optional(),
    weapon: z.array(OptionObjectSchema).optional(),
}).optional();


const CharacterProfileSchema = z.object({
    count: z.array(OptionObjectSchema),
    raceClass: z.array(OptionObjectSchema),
    gender: z.array(OptionObjectSchema),
    hair: z.array(OptionObjectSchema),
    eyes: z.array(OptionObjectSchema),
    skin: z.array(OptionObjectSchema),
    facialFeatures: z.array(OptionObjectSchema),
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
    weaponsExtra: z.array(OptionObjectSchema),
    pose: z.array(OptionObjectSchema),
    action: z.array(OptionObjectSchema),
    camera: z.array(OptionObjectSchema),
    background: z.array(OptionObjectSchema),
    effects: z.array(OptionObjectSchema),
});


export const GenerateDataPackSchemaOutputSchema = z.object({
  characterProfileSchema: CharacterProfileSchema.describe("The main schema object defining all available options for the character profile."),
  tags: z.array(z.string()).describe("An array of 3-5 relevant, single-word, lowercase tags that categorize the datapack (e.g., ['fantasy', 'sci-fi', 'horror']).")
});
export type GenerateDataPackSchemaOutput = z.infer<typeof GenerateDataPackSchemaOutputSchema>;
