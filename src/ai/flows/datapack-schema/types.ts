/**
 * @fileOverview Data schemas and types for the DataPack schema generation flow.
 * This file defines the Zod schemas for input and output validation,
 * and exports the corresponding TypeScript types.
 */

import { z } from 'genkit';

export const GenerateDataPackSchemaInputSchema = z.object({
  concept: z.string().describe('The core concept or theme for the DataPack (e.g., "cyberpunk space pirates", "lovecraftian horror investigators").'),
});
export type GenerateDataPackSchemaInput = z.infer<typeof GenerateDataPackSchemaInputSchema>;


// Define Zod schemas that match the types in src/types/datapack.ts
const ExclusionSchema = z.object({
    slotId: z.string().describe("The 'id' of the slot to which the exclusion applies."),
    optionValues: z.array(z.string()).describe("The 'value's of the options to be disabled in the target slot."),
});

const OptionSchema = z.object({
    label: z.string().describe("The user-facing name for this option (e.g., 'Chainmail Armor')."),
    value: z.string().describe("The value to be inserted into the prompt template (e.g., 'chainmail armor')."),
    exclusions: z.array(ExclusionSchema).optional().describe("A list of other options that this option is incompatible with."),
});

const SlotSchema = z.object({
    id: z.string().min(1).describe("A unique, snake_case identifier for this slot (e.g., 'armor_torso')."),
    label: z.string().min(1).describe("The user-facing name for this category (e.g., 'Torso Armor')."),
    type: z.enum(['text', 'select']).default('select').describe("The type of input. 'select' for a list of options, 'text' for free-form input."),
    options: z.array(OptionSchema).optional().describe("A list of choices for this slot. Required if type is 'select'."),
    defaultOption: z.string().optional().describe("The default 'value' to be pre-selected for this slot."),
    placeholder: z.string().optional().describe("Placeholder text for 'text' type inputs."),
    isLocked: z.boolean().optional().describe("If true, this slot is considered a core, unchangeable attribute of the pack and will not be shown to the user for configuration."),
});

export const GenerateDataPackSchemaOutputSchema = z.object({
  promptTemplate: z.string().describe("A detailed Handlebars-style prompt template string. It must include placeholders for all defined slot IDs, e.g., 'A {style} portrait of a {race} {class}.'."),
  slots: z.array(SlotSchema).describe("An array of 7-10 diverse and creative slot objects that define the customizable options for the DataPack."),
  tags: z.array(z.string()).describe("An array of 3-5 relevant, single-word, lowercase tags that categorize the datapack (e.g., ['fantasy', 'sci-fi', 'horror']).")
});
export type GenerateDataPackSchemaOutput = z.infer<typeof GenerateDataPackSchemaOutputSchema>;

    