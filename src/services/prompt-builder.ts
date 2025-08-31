
/**
 * @fileoverview This service provides utility functions for constructing final, render-ready
 * image generation prompts from a structured Character Bible object.
 */

import type { CharacterBible } from '@/ai/flows/character-bible/types';

/**
 * A helper function to safely join array elements or return a single string.
 * @param s - A string or an array of strings.
 * @returns A comma-separated string, or an empty string if the input is empty.
 */
const take = (s?: string | string[]): string => {
  if (Array.isArray(s)) {
    return s.filter(Boolean).join(", ");
  }
  return s ?? "";
};

/**
 * Assembles a detailed, single-line prompt for an image generation model
 * based on the structured data in a Character Bible.
 * @param d - The CharacterBible object.
 * @returns A formatted string ready to be sent to an image model.
 */
export function buildRenderPrompt(d: CharacterBible): string {
  if (!d) return "";

  const segments = [
    `A ${d.visual_core.art_style} of ${d.identity.premise} named ${d.meta.character_name}`,
    `(${d.anatomy.body_type} build, ${d.anatomy.skin_tone} skin)`,
    `${d.anatomy.hair.length} ${d.anatomy.hair.style} ${d.anatomy.hair.color} hair`,
    `${d.anatomy.eyes.color} ${d.anatomy.eyes.shape} eyes`,
    `expression: ${d.anatomy.expression}`,
    `wearing ${take([
      d.outfit.headgear,
      d.outfit.neck,
      d.outfit.shoulders,
      d.outfit.chest,
      d.outfit.arms,
      d.outfit.hands_gloves,
      d.outfit.waist_belt,
      d.outfit.legs,
      d.outfit.feet,
      d.outfit.back,
      ...d.outfit.accessories,
    ])};`,
    `motifs: ${take(d.visual_core.motifs)};`,
    `wielding ${d.armament.primary};`,
    `pose: ${d.scene.pose};`,
    `camera: ${d.scene.camera};`,
    `lighting: ${d.scene.lighting};`,
    `environment: ${d.scene.location}, ${d.scene.time_of_day}, ${d.scene.weather};`,
    `palette: ${take(d.visual_core.palette)};`,
    `tone: ${take(d.visual_core.tone)};`,
    `highly detailed, sharp silhouette, clean anatomy, masterpiece.`
  ];

  // Filter out any empty or "none" segments and join them.
  return segments
    .filter(s => Boolean(s) && !s.includes('none') && !s.includes('undefined'))
    .join(" ")
    .replace(/,;/g, ';') // Clean up formatting artifacts
    .replace(/; /g, '; ')
    .replace(/\s+/g, " ")
    .trim();
}


/**
 * Assembles a negative prompt by combining a default set of quality-improving
 * negative terms with any specific hints provided in the Character Bible.
 * @param d - The CharacterBible object.
 * @returns A comma-separated string of negative prompt terms.
 */
export function buildNegativePrompt(negative_hints: string[] = []): string {
    const defaultNegatives = [
        'low-res', 'bad hands', 'extra fingers', 'blurry background', 'overexposed',
        'underexposed', 'banding', 'jpeg artifacts', 'duplicate limbs', 'ugly',
        'bad anatomy', 'malformed', 'deformed', 'mutated', 'watermark', 'signature', 'text'
    ];

    const combined = [...defaultNegatives, ...negative_hints];
    return [...new Set(combined)].join(', '); // Ensure uniqueness
}
