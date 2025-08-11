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
  '--chart-1',
  '--chart-2',
  '--chart-3',
  '--chart-4',
  '--chart-5',
];
