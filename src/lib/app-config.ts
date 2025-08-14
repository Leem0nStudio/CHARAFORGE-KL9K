
import { Home, Package, ScrollText, Swords, UserCircle, BarChart, Settings, Bot, LucideIcon } from 'lucide-react';
import type { AiModel } from '@/types/ai-model';

export interface NavItem {
    href: string;
    label: string;
    icon: LucideIcon;
    requiresAuth?: boolean;
    isPrimary?: boolean;
}

// Static AI Model Definitions
export const imageModels: AiModel[] = [
    {
        id: 'gemini-placeholder',
        name: 'Gemini Image Generation',
        type: 'model',
        engine: 'gemini',
        civitaiModelId: '0',
        hf_id: 'googleai/gemini-2.0-flash-preview-image-generation',
        versionId: '1.0',
        createdAt: new Date(),
        updatedAt: new Date(),
    },
     {
        id: 'waiNSFWIllustrious_v140',
        name: 'waiNSFWIllustrious v1.4.0',
        type: 'model',
        engine: 'huggingface',
        hf_id: 'Ine007/waiNSFWIllustrious_v140',
        civitaiModelId: '0', 
        versionId: '1.0',
        createdAt: new Date(),
        updatedAt: new Date(),
    },
];

export const geminiTextPlaceholder: AiModel = {
    id: 'gemini-text-placeholder',
    name: 'Gemini 1.5 Flash',
    type: 'model',
    engine: 'gemini',
    civitaiModelId: '0', 
    hf_id: 'googleai/gemini-1.5-flash-latest',
    versionId: '1.0',
    createdAt: new Date(),
    updatedAt: new Date(),
};

// Define a list of default text models available to all users.
export const textModels: AiModel[] = [
    geminiTextPlaceholder,
    {
        id: 'gpt-4o-placeholder',
        name: 'OpenAI GPT-4o',
        type: 'model',
        engine: 'openrouter',
        civitaiModelId: '0',
        hf_id: 'openai/gpt-4o',
        versionId: '1.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        coverMediaUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/OpenAI_Logo.svg/1200px-OpenAI_Logo.svg.png',
    },
    {
        id: 'gpt-oss-20b-placeholder',
        name: 'GPT-OSS 20B (Free)',
        type: 'model',
        engine: 'openrouter',
        civitaiModelId: '0',
        hf_id: 'openai/gpt-oss-20b:free',
        versionId: '1.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        coverMediaUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/OpenAI_Logo.svg/1200px-OpenAI_Logo.svg.png',
    },
    {
        id: 'llama3-70b-placeholder',
        name: 'Meta Llama 3 70B',
        type: 'model',
        engine: 'openrouter',
        civitaiModelId: '0',
        hf_id: 'meta-llama/llama-3-70b-instruct',
        versionId: '1.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        coverMediaUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Meta-Logo.png',
    }
];


export const mainNavItems: NavItem[] = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/datapacks', label: 'DataPacks', icon: Package },
    { href: '/character-generator', label: 'Forge', icon: Swords, isPrimary: true },
    { href: '/lore-forge', label: 'Lore Forge', icon: ScrollText, requiresAuth: true },
    { href: '/profile', label: 'Profile', icon: UserCircle, requiresAuth: true },
];

export const adminNavItems: NavItem[] = [
    { href: '/admin', label: 'Dashboard', icon: BarChart },
    { href: '/admin/datapacks', label: 'DataPacks', icon: Package },
    { href: '/admin/models', label: 'AI Models', icon: Bot },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
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
