

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import type { UserPreferences } from '@/types/user';
import { BackButton } from '@/components/back-button';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import the tab components
import { ProfileForm } from '@/components/profile/profile-form';
import { PreferencesForm } from '@/components/profile/preferences-form';
import { StatsTab } from '@/components/profile/stats-tab';
import { DataPacksTab } from '@/components/profile/datapacks-tab';
import { SecurityTab } from '@/components/profile/security-tab';
import { MyModelsTab } from '@/components/profile/my-models-tab';

function ProfilePageContent() {
  const { userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

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

  useEffect(() => {
    if (!authLoading && !userProfile) {
      router.push('/login');
    }
  }, [userProfile, authLoading, router]);
  
  if (authLoading || !userProfile) {
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
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="datapacks">DataPacks</TabsTrigger>
                <TabsTrigger value="models">My Models</TabsTrigger>
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
             <TabsContent value="models" className="space-y-4">
                <MyModelsTab />
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

export default function ProfilePage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-screen w-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <ProfilePageContent />
        </Suspense>
    );
}
