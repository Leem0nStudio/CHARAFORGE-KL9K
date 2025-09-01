
/**
 * @fileoverview Defines the Zod schemas and TypeScript types for the Character Bible generation flow.
 * This represents the structured data contract between the user, the AI, and the application.
 */

import { z } from 'genkit';

// Input schema from the user, can be partial.
export const CharacterBibleInputSchema = z.object({
  series_id: z.string().optional().describe("An identifier for a series or project to maintain consistency."),
  character_name: z.string().optional().describe("The character's name."),
  role: z.enum(['protagonist', 'antagonist', 'support']).optional().describe("The character's role in the story."),
  premise: z.string().optional().describe("A short, one-line concept for the character (e.g., 'elf guardian of ancient ruins'). This is the primary source of truth."),
  personality: z.array(z.string()).optional().describe("A list of key personality traits."),
  backstory: z.string().optional().describe("A brief summary of the character's history."),
  skills: z.array(z.string()).optional().describe("The character's main abilities or skills."),
  cultural_influences: z.array(z.string()).optional().describe("Real-world or fictional cultural inspirations."),
  art_style: z.string().optional().describe("The desired art style for the output."),
  color_palette: z.array(z.string()).optional().describe("A list of key colors."),
  tone: z.array(z.string()).optional().describe("Adjectives describing the mood and tone."),
  environment: z.object({
    location: z.string().optional(),
    time_of_day: z.string().optional(),
    weather: z.string().optional(),
  }).optional().describe("The scene's environment."),
  pose: z.string().optional().describe("The character's desired pose."),
  camera: z.string().optional().describe("The desired camera framing and angle."),
  lighting: z.string().optional().describe("The desired lighting setup."),
  negative_hints: z.array(z.string()).optional().describe("A list of elements to explicitly avoid."),
  seed_hint: z.union([z.string(), z.number()]).optional().describe("A seed for reproducibility.")
});
export type CharacterBibleInput = z.infer<typeof CharacterBibleInputSchema>;


// The full, structured output schema that the AI must generate.
export const CharacterBibleOutputSchema = z.object({
  meta: z.object({
    series_id: z.string().describe("Identifier for the series or project."),
    character_name: z.string().describe("The character's full name."),
    seed_hint: z.string().describe("A seed value or hint for reproducibility."),
    tags: z.array(z.string()).describe("A list of short, relevant tags for categorization.")
  }),
  identity: z.object({
    role: z.string().describe("The character's role (e.g., protagonist, antagonist)."),
    premise: z.string().describe("A concise one-liner describing the character's core concept."),
    personality: z.array(z.string()).describe("Key personality traits."),
    backstory: z.string().describe("A short paragraph summarizing the character's history.")
  }),
  visual_core: z.object({
    silhouette: z.string().describe("A concise description of the character's overall shape and recognizable features."),
    motifs: z.array(z.string()).describe("2-3 recurring visual motifs or symbols associated with the character."),
    palette: z.array(z.string()).describe("The primary color palette."),
    art_style: z.string().describe("The final art style for rendering."),
    tone: z.array(z.string()).describe("Adjectives describing the mood and feeling of the visuals.")
  }),
  anatomy: z.object({
    body_type: z.string().describe("Description of the character's build (e.g., athletic, slim, stocky)."),
    skin_tone: z.string().describe("The character's skin tone."),
    face_shape: z.string().describe("The shape of the character's face."),
    hair: z.object({
      color: z.string(),
      style: z.string(),
      length: z.string()
    }),
    eyes: z.object({
      color: z.string(),
      shape: z.string()
    }),
    unique_marks: z.array(z.string()).describe("Any unique scars, tattoos, or markings."),
    expression: z.string().describe("The character's default or most common facial expression."),
    body_language: z.string().describe("Cues about the character's typical posture and body language.")
  }),
  outfit: z.object({
    headgear: z.string().describe("Headwear like a helmet, hood, crown, or 'none'."),
    neck: z.string().describe("Neckwear like a scarf, gorget, amulet, or 'none'."),
    shoulders: z.string().describe("Shoulder gear like pauldrons, a mantle, or 'none'."),
    chest: z.string().describe("Main chest covering, like armor, a corset, or a robe."),
    arms: z.string().describe("Arm coverings like sleeves, vambraces, or 'bare'."),
    hands_gloves: z.string().describe("Hand coverings like gauntlets, gloves, or 'bare'."),
    waist_belt: z.string().describe("The type of belt worn."),
    legs: z.string().describe("Leg coverings like greaves, leggings, or a skirt."),
    feet: z.string().describe("Footwear like boots, sandals, or 'bare'."),
    back: z.string().describe("Items worn on the back, like a cape, quiver, wings, or 'none'."),
    accessories: z.array(z.string()).describe("Other accessories like jewelry, pouches, or talismans.")
  }),
  armament: z.object({
    primary: z.string().describe("The character's primary weapon or tool."),
    secondary: z.string().describe("A secondary weapon, tool, or 'none'."),
    magic_fx: z.array(z.string()).describe("Visual effects associated with their magic or abilities.")
  }),
  scene: z.object({
    location: z.string().describe("The setting or location."),
    time_of_day: z.string().describe("The time of day."),
    weather: z.string().describe("The weather conditions."),
    pose: z.string().describe("A detailed description of the character's pose."),
    camera: z.string().describe("The camera framing, angle, and lens type."),
    lighting: z.string().describe("The lighting recipe for the scene.")
  }),
  notes: z.string().describe("Additional notes from the AI about consistency, rationale, or suggestions for the user.")
});
export type CharacterBible = z.infer<typeof CharacterBibleOutputSchema>;
