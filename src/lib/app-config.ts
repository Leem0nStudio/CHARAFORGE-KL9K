
'use server';

import { adminDb } from '@/lib/firebase/server';
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


/**
 * Fetches the application's logo URL from the Firestore configuration.
 * Uses a 'no-store' cache policy to ensure the most recent logo is always fetched.
 * @returns {Promise<string | null>} A promise that resolves to the logo URL string, or null if not found.
 */
export async function getLogoUrl(): Promise<string | null> {
    try {
        if (!adminDb) {
            // This should not happen in production, but it's a good safeguard.
            console.error("Firestore is not initialized. Cannot fetch logo URL.");
            return null;
        }
        
        const configDoc = await adminDb.collection('settings').doc('appDetails').get();

        if (configDoc.exists) {
            return configDoc.data()?.logoUrl || null;
        }
        
        return null;

    } catch (error) {
        console.error("Error fetching logo URL from Firestore:", error);
        return null;
    }
}
