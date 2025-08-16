/**
 * @fileoverview Defines the data structures and initial definitions for the gamification system.
 */

export type AchievementCategory = 'creation' | 'exploration' | 'social' | 'premium' | 'community';

/**
 * Defines the structure for a single achievement in the application.
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // Icon name from lucide-react or a custom SVG path
  points: number;
  category: AchievementCategory;
}

/**
 * A predefined list of achievements available in the application.
 * This can be used to seed a database collection or for static reference.
 */
export const achievements: Achievement[] = [
  // Creation Achievements
  {
    id: 'first_character',
    name: 'First Steps',
    description: 'Forge your very first character.',
    icon: 'Swords',
    points: 10,
    category: 'creation',
  },
  {
    id: 'ten_characters',
    name: 'Novice Forgemaster',
    description: 'Create 10 characters.',
    icon: 'Swords',
    points: 50,
    category: 'creation',
  },
  {
    id: 'first_datapack_use',
    name: 'Apprentice Wizard',
    description: 'Use a DataPack to create a character.',
    icon: 'Package',
    points: 20,
    category: 'creation',
  },
  {
    id: 'first_story',
    name: 'Budding Chronicler',
    description: 'Generate your first story in the Lore Forge.',
    icon: 'ScrollText',
    points: 30,
    category: 'creation',
  },

  // Social & Community Achievements
  {
    id: 'first_like',
    name: 'Friendly Face',
    description: 'Receive your first like on a public character.',
    icon: 'Heart',
    points: 10,
    category: 'social',
  },
  {
    id: 'community_contributor',
    name: 'Community Hero',
    description: 'Receive 50+ likes in total across all your characters.',
    icon: 'Flame',
    points: 200,
    category: 'social',
  },
   {
    id: 'sharer',
    name: 'Town Crier',
    description: 'Make your first character public.',
    icon: 'Share2',
    points: 15,
    category: 'social',
  },
  {
    id: 'branch_out',
    name: 'Kindred Spirit',
    description: 'Branch another user\'s public character.',
    icon: 'GitBranch',
    points: 25,
    category: 'social',
  },

  // Exploration & Collection Achievements
  {
    id: 'install_datapack',
    name: 'Collector',
    description: 'Install your first DataPack from the catalog.',
    icon: 'Download',
    points: 10,
    category: 'exploration',
  },
  {
    id: 'install_model',
    name: 'AI Enthusiast',
    description: 'Install your first AI Model from the catalog.',
    icon: 'Bot',
    points: 10,
    category: 'exploration',
  },
   {
    id: 'custom_model',
    name: 'Tinkerer',
    description: 'Add your own custom model or LoRA.',
    icon: 'Wrench',
    points: 50,
    category: 'exploration',
  },

  // Premium Achievements
  {
    id: 'premium_user',
    name: 'Valued Patron',
    description: 'Upgrade to a premium tier.',
    icon: 'Gem',
    points: 100,
    category: 'premium',
  },
];
