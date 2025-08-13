
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import type { UserPreferences, UserProfile } from '@/types/user';
import type { DataPack } from '@/types/datapack';
import { getInstalledDataPacks } from '@/app/actions/datapacks';
import { BackButton } from '@/components/back-button';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import the newly created tab components
import { ProfileForm } from '@/components/profile/profile-form';
import { PreferencesForm } from '@/components/profile/preferences-form';
import { StatsTab } from '@/components/profile/stats-tab';
import { DataPacksTab } from '@/components/profile/datapacks-tab';
import { SecurityTab } from '@/components/profile/security-tab';


export default function ProfilePage() {
  const { userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [installedPacks, setInstalledPacks] = useState<DataPack[]>([]);

  // Default preferences to avoid null issues before userProfile is loaded
  const defaultPreferences: UserPreferences = {
    theme: 'system',
    notifications: { email: false },
    privacy: { profileVisibility: 'private' },
  };
  
  const [preferences, setPreferences] = useState<UserPreferences>(
    userProfile?.preferences || defaultPreferences
  );

  useEffect(() => {
    if (userProfile?.preferences) {
      setPreferences(userProfile.preferences);
    }
  }, [userProfile?.preferences]);

  const loadInstalledPacks = useCallback(async () => {
    try {
      const packs = await getInstalledDataPacks();
      setInstalledPacks(packs);
    } catch (error) {
      console.error("Failed to load installed packs", error);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return; // Wait until auth state is resolved

    if (!userProfile) {
      router.push('/login');
      return;
    }
    
    // Auth is loaded and we have a user profile, now load their data
    const loadData = async () => {
        setIsLoading(true);
        await loadInstalledPacks();
        setIsLoading(false);
    }
    loadData();

  }, [userProfile, authLoading, router, loadInstalledPacks]);
  
  if (authLoading || isLoading || !userProfile) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
        className="container py-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
    >
      <BackButton
        title="Profile Settings"
        description="Manage your account, preferences, and more."
       />
      <div className="max-w-7xl mx-auto">
        <Tabs defaultValue="profile" className="space-y-4">
            <TabsList>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="datapacks">DataPacks</TabsTrigger>
                <TabsTrigger value="prefs">Preferences</TabsTrigger>
                <TabsTrigger value="stats">Statistics</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
            <TabsContent value="profile" className="space-y-4">
                <ProfileForm user={userProfile} />
            </TabsContent>
            <TabsContent value="datapacks" className="space-y-4">
                <DataPacksTab 
                    packs={installedPacks} 
                    isLoading={isLoading}
                />
            </TabsContent>
            <TabsContent value="prefs" className="space-y-4">
                <PreferencesForm 
                    preferences={preferences}
                    onPreferencesChange={setPreferences}
                />
            </TabsContent>
            <TabsContent value="stats" className="space-y-4">
                <StatsTab userStats={userProfile.stats} />
            </TabsContent>
            <TabsContent value="security" className="space-y-4">
                <SecurityTab />
            </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
}
