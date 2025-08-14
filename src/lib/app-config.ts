
import { Home, Package, ScrollText, Swords, UserCircle, BarChart, Settings, Bot, LucideIcon } from 'lucide-react';

export interface NavItem {
    href: string;
    label: string;
    icon: LucideIcon;
    requiresAuth?: boolean;
    isPrimary?: boolean;
}

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

// Corresponds to the text-chart-* classes in tailwind.config.ts
const slotCategoryColorClasses = {
    appearance: 'text-chart-1 bg-chart-1/10 border-chart-1/50', // Blue
    equipment: 'text-chart-5 bg-chart-5/10 border-chart-5/50',   // Red
    style: 'text-chart-2 bg-chart-2/10 border-chart-2/50',       // Green
    setting: 'text-chart-3 bg-chart-3/10 border-chart-3/50',     // Yellow
    class: 'text-chart-4 bg-chart-4/10 border-chart-4/50',       // Orange
    misc: 'text-muted-foreground bg-muted-foreground/10 border-muted-foreground/20',
};
type SlotCategory = keyof typeof slotCategoryColorClasses;

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
 * Gets the Tailwind CSS color class for a given slot ID or tag based on its category.
 * @param id The ID of the slot or the tag string (e.g., 'hair_color', 'weapon', 'fantasy').
 * @returns A string containing the Tailwind CSS classes for the color.
 */
export function getSlotColorClass(id: string): string {
  // First, check if the ID matches a known slot ID
  const category = slotIdToCategoryMap[id] || 'misc';
  
  // If we want to add specific keyword matching for general tags (like from datapack tags)
  // we can add it here. For now, we default to the category mapping or misc.
  // Example: if (id === 'fantasy') return slotCategoryColorClasses['class'];

  return slotCategoryColorClasses[category];
}
