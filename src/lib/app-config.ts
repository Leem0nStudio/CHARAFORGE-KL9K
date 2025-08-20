
import { Home, Package, ScrollText, Swords, UserCircle, BarChart, Settings, Bot, LucideIcon, Download, TestTube, Film } from 'lucide-react';
import type { AiModel } from '@/types/ai-model';

// Static AI Model Definitions are now empty by default.
// The administrator will add all production models via the admin panel.
export const imageModels: AiModel[] = [];

export const geminiImagePlaceholder: AiModel = {
    id: 'gemini-2-flash-image',
    name: 'Gemini 2.0 Flash',
    type: 'model',
    engine: 'gemini',
    hf_id: 'googleai/gemini-2.0-flash-preview-image-generation',
    coverMediaUrl: 'https://storage.googleapis.com/gweb-aistudio-assets/meet-gemini/gallery-illustrious-vibrant.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
    baseModel: 'Gemini',
    civitaiModelId: undefined,
    modelslabModelId: undefined,
    versionId: undefined,
    userId: undefined,
}


export const textModels: AiModel[] = [];


// Navigation items for the main site and the mobile bottom bar.
export const mainNavItems: NavItem[] = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/datapacks', label: 'DataPacks', icon: Package },
    { href: '/character-generator', label: 'Forge', icon: Swords, isPrimary: true },
    { href: '/lore-forge', label: 'Lore Forge', icon: ScrollText, requiresAuth: true },
    { href: '/profile', label: 'Profile', icon: UserCircle, requiresAuth: true },
];

// Navigation items for the admin dashboard sidebar.
export const adminNavItems: NavItem[] = [
    { href: '/admin', label: 'Dashboard', icon: BarChart },
    { href: '/admin/datapacks', label: 'DataPacks', icon: Package },
    { href: '/admin/models', label: 'AI Models', icon: Bot },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
];

// Definition for a navigation item.
interface NavItem {
    href: string;
    label: string;
    icon: LucideIcon;
    isPrimary?: boolean;
    requiresAuth?: boolean;
}

type SlotCategory = 'appearance' | 'equipment' | 'style' | 'setting' | 'class' | 'misc';

// A more robust mapping of slot IDs and keywords to categories for UI styling.
const slotIdToCategoryMap: Record<string, SlotCategory> = {
    // Appearance
    gender: 'appearance',
    race: 'appearance',
    hair: 'appearance',
    hair_style: 'appearance',
    hair_color: 'appearance',
    eye_style: 'appearance',
    facial_detail: 'appearance',
    body_type: 'appearance',
    expression: 'appearance',
    // Equipment
    armor: 'equipment',
    armor_torso: 'equipment',
    armor_legs: 'equipment',
    weapon: 'equipment',
    headwear: 'equipment',
    footwear: 'equipment',
    topwear: 'equipment',
    bottomwear: 'equipment',
    shoulders: 'equipment',
    hands: 'equipment',
    // Style
    style: 'style',
    art_style: 'style',
    lighting: 'style',
    // Setting
    background_setting: 'setting',
    background: 'setting',
    location: 'setting',
    // Class/Role
    class: 'class',
    role: 'class',
    // Misc
    name: 'misc',
};

/**
 * Gets a visual category for a given slot ID or tag.
 * Used to apply consistent colors to badges across the UI.
 * @param id The ID of the slot or the tag string (e.g., 'hair_color', 'weapon', 'fantasy').
 * @returns A string representing the category.
 */
export function getSlotCategory(id: string): SlotCategory {
  const cleanedId = id.toLowerCase();
  
  // First, check for an exact match in our map.
  if (slotIdToCategoryMap[cleanedId]) {
    return slotIdToCategoryMap[cleanedId];
  }
  
  // If no exact match, check for keywords.
  for (const key in slotIdToCategoryMap) {
      if (cleanedId.includes(key)) {
          return slotIdToCategoryMap[key];
      }
  }

  // Add keyword-based matching for general tags
  if (['fantasy', 'sci-fi', 'cyberpunk', 'horror', 'steampunk', 'post-apocalyptic'].some(t => cleanedId.includes(t))) return 'class';
  if (['illustration', 'painting', 'photorealistic', 'sketch', 'anime', 'manga'].some(t => cleanedId.includes(t))) return 'style';

  return 'misc';
}
