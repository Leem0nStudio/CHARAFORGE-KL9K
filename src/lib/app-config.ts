import { Home, Package, ScrollText, Swords, UserCircle, BarChart, Settings, LucideIcon } from 'lucide-react';

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
    { href: '/character-generator', label: 'Create', icon: Swords, isPrimary: true },
    { href: '/story-forge', label: 'Story Forge', icon: ScrollText, requiresAuth: true },
    { href: '/profile', label: 'Profile', icon: UserCircle, requiresAuth: true },
];

export const adminNavItems: NavItem[] = [
    { href: '/admin', label: 'Dashboard', icon: BarChart },
    { href: '/admin/datapacks', label: 'DataPacks', icon: Package },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export const chartColors = [
  'text-chart-1',
  'text-chart-2',
  'text-chart-3',
  'text-chart-4',
  'text-chart-5',
];

type SlotCategory = 'appearance' | 'equipment' | 'style' | 'setting' | 'class' | 'misc';

const slotCategoryColors: Record<SlotCategory, string> = {
    appearance: 'text-chart-1', // Blue
    equipment: 'text-chart-5',   // Red
    style: 'text-chart-2',       // Green
    setting: 'text-chart-3',     // Yellow
    class: 'text-chart-4',       // Orange
    misc: 'text-muted-foreground',
};

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
 * Gets the Tailwind CSS color class for a given slot ID based on its category.
 * @param slotId The ID of the slot (e.g., 'hair_color', 'weapon').
 * @returns A string containing the Tailwind CSS class for the color.
 */
export function getSlotColorClass(slotId: string): string {
  const category = slotIdToCategoryMap[slotId] || 'misc';
  return slotCategoryColors[category];
}
