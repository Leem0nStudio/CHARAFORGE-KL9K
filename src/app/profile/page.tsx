
'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { updateUserProfile, deleteUserAccount, updateUserPreferences, getInstalledDataPacks, type ActionResponse } from '@/app/actions/user';
import { Loader2, User, Swords, Heart, Package, Gem, Calendar, Wand2, Upload, Link as LinkIcon, Camera } from 'lucide-react';
import type { UserProfile, UserStats, UserPreferences } from '@/types/user';
import type { DataPack } from '@/types/datapack';
import { format } from 'date-fns';
import { PageHeader } from '@/components/page-header';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


// #region Sub-components for each Tab

const StatCard = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{label}</CardTitle>
            <div className="text-muted-foreground">{icon}</div>
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);
StatCard.displayName = "StatCard";


function AvatarUploader({ user, onAvatarChange }: { user: UserProfile, onAvatarChange: (newUrl: string) => void }) {
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        setPreview(user.photoURL);
    }, [user.photoURL]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const newUrl = reader.result as string;
                setPreview(newUrl);
                onAvatarChange(newUrl);
            };
            reader.readAsDataURL(file);
        }
    };

    const fallback = user.displayName?.charAt(0) || user.email?.charAt(0) || '?';
    
    return (
        <div className="flex items-center gap-4">
            <Avatar className="w-24 h-24 text-4xl">
                 <AvatarImage src={preview || undefined} alt={user.displayName || 'User Avatar'} key={preview} />
                <AvatarFallback>{fallback}</AvatarFallback>
            </Avatar>
            <div className="grid gap-1.5">
                <div className="relative">
                    <Label 
                        htmlFor="photoFile" 
                        className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2"
                    >
                       <Camera className="mr-2"/> Change Avatar
                    </Label>
                     <Input 
                        id="photoFile" 
                        name="photoFile" 
                        type="file" 
                        className="absolute w-full h-full opacity-0 cursor-pointer top-0 left-0"
                        accept="image/png, image/jpeg" 
                        onChange={handleFileChange}
                     />
                </div>
                <p className="text-xs text-muted-foreground">JPG, PNG. 5MB max.</p>
            </div>
        </div>
    );
}

function ProfileForm({ user, onProfileUpdate }: { user: UserProfile, onProfileUpdate: (updatedUser: Partial<UserProfile>) => void }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleAction = async (formData: FormData) => {
    startTransition(async () => {
        const result = await updateUserProfile(formData);
        if (result.success) {
            toast({ title: 'Success!', description: result.message });
            if (result.newAvatarUrl) {
                onProfileUpdate({ photoURL: result.newAvatarUrl, avatarUpdatedAt: Date.now() });
            } else {
                 onProfileUpdate({ displayName: formData.get('displayName') as string });
            }
        } else {
            toast({ variant: 'destructive', title: 'Update Failed', description: result.message || 'An unknown error occurred.' });
        }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Public Profile</CardTitle>
        <CardDescription>This is how others will see you on the site.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleAction} className="space-y-6">
            <AvatarUploader user={user} onAvatarChange={(newUrl) => onProfileUpdate({ photoURL: newUrl, avatarUpdatedAt: Date.now() })} />
            <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input 
                    id="displayName" 
                    name="displayName" 
                    defaultValue={user.displayName || ''}
                />
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="photoUrl">Or paste image URL</Label>
                <Input 
                    id="photoUrl" 
                    name="photoUrl"
                    placeholder="https://example.com/avatar.png"
                />
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={user.email || ''} disabled />
            </div>

            <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Profile
            </Button>
        </form>
      </CardContent>
    </Card>
  );
}
ProfileForm.displayName = "ProfileForm";

function PreferencesForm({ initialPreferences }: { initialPreferences: UserPreferences }) {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<UserPreferences>(initialPreferences);
  const [isSavingPrefs, startPrefsTransition] = useTransition();

  const handlePreferencesChange = useCallback((field: keyof UserPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleNestedPreferencesChange = useCallback((parent: 'notifications' | 'privacy', field: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent] as any),
        [field]: value,
      },
    }));
  }, []);

  const handleSavePreferences = useCallback(() => {
    startPrefsTransition(async () => {
      const result = await updateUserPreferences(preferences);
      if (result.success) {
        toast({ title: 'Preferences Saved', description: result.message });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  }, [preferences, toast]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
        <CardDescription>Manage your application settings and personalize your experience.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-4">
            <Label className="text-base font-semibold">Theme</Label>
             <RadioGroup 
                value={preferences.theme} 
                onValueChange={(value: 'light' | 'dark' | 'system') => handlePreferencesChange('theme', value)}
                className="flex space-x-4"
             >
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="light" id="light" />
                    <Label htmlFor="light">Light</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dark" id="dark" />
                    <Label htmlFor="dark">Dark</Label>
                </div>
                 <div className="flex items-center space-x-2">
                    <RadioGroupItem value="system" id="system" />
                    <Label htmlFor="system">System</Label>
                </div>
            </RadioGroup>
        </div>
        <div className="space-y-4">
            <Label className="text-base font-semibold">Notifications</Label>
            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <CardDescription>Receive emails about important account activity.</CardDescription>
                </div>
                <Switch 
                    checked={preferences.notifications.email}
                    onCheckedChange={(checked) => handleNestedPreferencesChange('notifications', 'email', checked)}
                />
            </div>
        </div>
         <div className="space-y-4">
            <Label className="text-base font-semibold">Privacy</Label>
             <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                    <Label>Public Profile</Label>
                    <CardDescription>Allow other users to see your profile and creations.</CardDescription>
                </div>
                <Switch
                   checked={preferences.privacy.profileVisibility === 'public'}
                   onCheckedChange={(checked) => handleNestedPreferencesChange('privacy', 'profileVisibility', checked ? 'public' : 'private')}
                />
            </div>
        </div>
         <Button onClick={handleSavePreferences} disabled={isSavingPrefs}>
            {isSavingPrefs && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Preferences
        </Button>
      </CardContent>
    </Card>
  );
}
PreferencesForm.displayName = "PreferencesForm";

function StatsTab({ userStats }: { userStats?: UserStats }) {
    const memberSince = userStats?.memberSince;
    let memberSinceDate = 'N/A';
    if (memberSince) {
      // The value is already a number (milliseconds), safe to use directly
      const date = new Date(memberSince);
      memberSinceDate = format(date, 'PPP');
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Your Activity</CardTitle>
                <CardDescription>An overview of your contributions and activity on CharaForge.</CardDescription>
            </CardHeader>
            <CardContent>
               {userStats ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <StatCard icon={<Swords />} label="Characters Created" value={userStats.charactersCreated} />
                        <StatCard icon={<Heart />} label="Total Likes Received" value={userStats.totalLikes} />
                        <StatCard icon={<Gem />} label="Subscription Tier" value={userStats.subscriptionTier} />
                        <StatCard icon={<User />} label="Collections Created" value={userStats.collectionsCreated} />
                        <StatCard icon={<Package />} label="DataPacks Installed" value={userStats.installedPacks.length} />
                        <StatCard icon={<Calendar />} label="Member Since" value={memberSinceDate} />
                    </div>
               ) : (
                 <p className="text-muted-foreground">Statistics are not available yet. Please check back later.</p>
               )}
            </CardContent>
        </Card>
    );
}
StatsTab.displayName = "StatsTab";

function DataPacksTab() {
    const [packs, setPacks] = useState<DataPack[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadPacks() {
            setIsLoading(true);
            const installedPacks = await getInstalledDataPacks();
            setPacks(installedPacks);
            setIsLoading(false);
        }
        loadPacks();
    }, []);

    if (isLoading) {
        return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Installed DataPacks</CardTitle>
                <CardDescription>The creative building blocks you've collected. Use them in the Character Generator.</CardDescription>
            </CardHeader>
            <CardContent>
                {packs.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-4">
                        {packs.map(pack => (
                            <div key={pack.id} className="border p-4 rounded-lg flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold">{pack.name}</h3>
                                    <p className="text-sm text-muted-foreground">by {pack.author}</p>
                                </div>
                                <Button asChild variant="secondary" size="sm">
                                    <Link href="/character-generator">
                                        <Wand2 className="mr-2 h-4 w-4" /> Use
                                    </Link>
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                     <div className="text-center text-muted-foreground py-12">
                        <p className="mb-4">You haven't installed any DataPacks yet.</p>
                        <Button asChild>
                            <Link href="/datapacks">Browse Catalog</Link>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
DataPacksTab.displayName = "DataPacksTab";


function SecurityTab() {
  const { toast } = useToast();
  const router = useRouter();
  const [isDeleting, startDeleteTransition] = useTransition();

  const handleDeleteAccount = useCallback(async () => {
    startDeleteTransition(async () => {
      const result = await deleteUserAccount();
      if (result.success) {
        toast({ title: 'Account Deleted', description: result.message });
        router.push('/');
        router.refresh(); 
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  }, [toast, router]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Change your password here. For security, this feature is not yet fully implemented.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="space-y-2">
              <Label htmlFor="new--password">New Password</Label>
              <Input id="new-password" type="password" disabled />
            </div>
             <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" disabled />
            </div>
            <Button disabled>Change Password</Button>
        </CardContent>
      </Card>
       <Card className="border-destructive">
         <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
          <CardDescription>Permanently delete your account and all of your content. This action is not reversible.</CardDescription>
        </CardHeader>
        <CardContent>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isDeleting}>Delete My Account</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your
                        account and remove all your data from our servers.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount} disabled={isDeleting}>
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Continue
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </CardContent>
       </Card>
     </div>
  );
}
SecurityTab.displayName = "SecurityTab";

// #endregion

export default function ProfilePage() {
  const { userProfile, loading, setUserProfile } = useAuth(); // Use setUserProfile from context
  const router = useRouter();
  
  const [localUserProfile, setLocalUserProfile] = useState(userProfile);
  
  useEffect(() => {
    setLocalUserProfile(userProfile);
  }, [userProfile]);

  const handleProfileUpdate = useCallback((updates: Partial<UserProfile>) => {
    const updatedProfile = { ...localUserProfile, ...updates } as UserProfile;
    setLocalUserProfile(updatedProfile);
    setUserProfile(updatedProfile); // Also update the global context
  }, [localUserProfile, setUserProfile]);

  const defaultPreferences: UserPreferences = {
    theme: 'system',
    notifications: { email: false },
    privacy: { profileVisibility: 'private' },
  };

  useEffect(() => {
    if (!loading && !localUserProfile) {
      router.push('/login');
    }
  }, [localUserProfile, loading, router]);
  
  if (loading || !localUserProfile) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const userPreferences = (localUserProfile?.preferences as UserPreferences) || defaultPreferences;
  const userStats = localUserProfile?.stats;

  return (
    <motion.div
        className="container py-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
    >
      <PageHeader
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
                <ProfileForm user={localUserProfile} onProfileUpdate={handleProfileUpdate} />
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
