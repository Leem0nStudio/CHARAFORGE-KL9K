

import { Home, Package, ScrollText, Swords, UserCircle, BarChart, Settings, Bot, LucideIcon, Download, TestTube } from 'lucide-react';
import type { AiModel } from '@/types/ai-model';

// Static AI Model Definitions - these are fallbacks or system-provided defaults.
export const imageModels: AiModel[] = [
    {
        id: 'huggingface-sdxl-1-0',
        name: 'Stable Diffusion XL 1.0',
        type: 'model',
        engine: 'huggingface',
        hf_id: 'stabilityai/stable-diffusion-xl-base-1.0',
        coverMediaUrl: 'https://storage.googleapis.com/gweb-aistudio-assets/meet-gemini/gallery-illustrious-vibrant.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
    }
];

export const textModels: AiModel[] = [
    {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        type: 'model',
        engine: 'gemini',
        hf_id: 'gemini-1.5-flash-latest', // Corrected ID for Genkit googleAI() plugin
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: 'gpt-4o',
        name: 'GPT-4o',
        type: 'model',
        engine: 'openrouter',
        hf_id: 'openai/gpt-4o',
        createdAt: new Date(),
        updatedAt: new Date(),
    }
];


export const mainNavItems: NavItem[] = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/datapacks', label: 'DataPacks', icon: Package },
    { href: '/models', label: 'AI Models', icon: Bot },
    { href: '/character-generator', label: 'Forge', icon: Swords, isPrimary: true },
    { href: '/lore-forge', label: 'Lore Forge', icon: ScrollText, requiresAuth: true },
    { href: '/profile', label: 'Profile', icon: UserCircle, requiresAuth: true },
];

export const adminNavItems: NavItem[] = [
    { href: '/admin', label: 'Dashboard', icon: BarChart },
    { href: '/admin/datapacks', label: 'DataPacks', icon: Package },
    { href: '/admin/models', label: 'AI Models', icon: Bot },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
    { href: '/admin/vertex-test', label: 'Vertex Test', icon: TestTube },
];

type SlotCategory = 'appearance' | 'equipment' | 'style' | 'setting' | 'class' | 'misc';

const slotIdToCategoryMap: Record<string, SlotCategory> = {
    // Appearance
    gender: 'appearance',
    race: 'appearance',
    hair_style: 'appearance',
    hair_color: 'appearance',
    eye_style: 'appearance',
    facial_detail: 'appearance',
    body_type: 'appearance',
    breast_shape: 'appearance',
    face: 'appearance',
    expression: 'appearance',
    // Equipment
    armor_torso: 'equipment',
    armor_legs: 'equipment',
    weapon: 'equipment',
    headwear: 'equipment',
    upper_torso: 'equipment',
    arms: 'equipment',
    hands: 'equipment',
    waist: 'equipment',
    legs: 'equipment',
    feet: 'equipment',
    back: 'equipment',
    neck: 'equipment',
    shoulders: 'equipment',
    headgear: 'equipment',
    // Style
    style: 'style',
    art_style: 'style',
    // Setting
    background_setting: 'setting',
    background: 'setting',
    lighting: 'setting',
    specialEffects: 'setting',
    lighting_style: 'setting',
    // Class/Role
    class: 'class',
    role: 'class',
    baseType: 'class',
    // Misc
    name: 'misc',
    cyber_mods: 'misc',
};

/**
 * Gets the category for a given slot ID or tag.
 * @param id The ID of the slot or the tag string (e.g., 'hair_color', 'weapon', 'fantasy').
 * @returns A string representing the category.
 */
export function getSlotCategory(id: string): SlotCategory {
  // First, check if the ID matches a known slot ID
  const category = slotIdToCategoryMap[id];
  if (category) return category;

  // Add keyword-based matching for general tags
  if (['fantasy', 'sci-fi', 'cyberpunk', 'horror'].some(t => id.includes(t))) return 'class';
  if (['illustration', 'painting', 'photorealistic', 'sketch'].some(t => id.includes(t))) return 'style';

  return 'misc';
}


    

    
