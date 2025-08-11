'use client';

import { useEffect, useState, useTransition, useActionState, ChangeEvent, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import type { UserProfile, UserPreferences } from '@/types/user';
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
  const { userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !userProfile) {
      router.push('/login');
    }
  }, [userProfile, loading, router]);
  
  if (loading || !userProfile) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const defaultPreferences: UserPreferences = {
    theme: 'system',
    notifications: { email: false },
    privacy: { profileVisibility: 'private' },
  };

  const userPreferences = userProfile.preferences || defaultPreferences;
  const userStats = userProfile.stats;

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
                <DataPacksTab />
            </TabsContent>
            <TabsContent value="prefs" className="space-y-4">
                <PreferencesForm initialPreferences={userPreferences} />
            </TabsContent>
            <TabsContent value="stats" className="space-y-4">
                <StatsTab userStats={userStats} />
            </TabsContent>
            <TabsContent value="security" className="space-y-4">
                <SecurityTab />
            </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
}
