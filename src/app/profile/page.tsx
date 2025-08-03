
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserStats } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { updateUserProfile, deleteUserAccount, updateUserPreferences } from './actions';
import { Loader2, User, Swords, Heart, Package, Gem, Calendar } from 'lucide-react';
import type { UserPreferences } from './actions';
import { format } from 'date-fns';

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) {
    return (
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
}


export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'system',
    notifications: { email: false },
    privacy: { profileVisibility: 'private' },
  });

  useEffect(() => {
    // This would typically be fetched from the user's document in a real app
    // For now, we'll use defaults and let the user save them.
    // In a full implementation, you'd fetch userDoc.data().preferences
  }, [user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const handleUpdateProfile = async (formData: FormData) => {
    setIsSubmitting(true);
    const result = await updateUserProfile(formData);
    if (result.success) {
      toast({ title: 'Success', description: result.message });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
    setIsSubmitting(false);
  };
  
  const handleDeleteAccount = async () => {
    setIsSubmitting(true);
    const result = await deleteUserAccount();
     if (result.success) {
      toast({ title: 'Account Deleted', description: result.message });
      router.push('/');
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
    setIsSubmitting(false);
  }

  const handlePreferencesChange = (field: keyof UserPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
  };
  
  const handleNestedPreferencesChange = (parent: 'notifications' | 'privacy', field: string, value: any) => {
      setPreferences(prev => ({
          ...prev,
          [parent]: {
              ...(prev[parent] as any),
              [field]: value
          }
      }));
  }

  const handleSavePreferences = () => {
    startTransition(async () => {
        const result = await updateUserPreferences(preferences);
        if (result.success) {
            toast({ title: 'Preferences Saved', description: result.message });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
    });
  }
  
  const userStats = user.stats;
  const memberSinceDate = userStats?.memberSince?.toDate ? format(userStats.memberSince.toDate(), 'PPP') : 'N/A';

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Profile Settings</h2>
      </div>
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="prefs">Preferences</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Public Profile</CardTitle>
              <CardDescription>
                This is how others will see you on the site.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input id="displayName" name="displayName" defaultValue={user.displayName || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue={user.email || ''} disabled />
                </div>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Profile
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
         <TabsContent value="prefs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>
                Manage your application settings and personalize your experience.
              </CardDescription>
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
                
                 <Button onClick={handleSavePreferences} disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Preferences
                </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="stats" className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Your Activity</CardTitle>
                    <CardDescription>
                        An overview of your contributions and activity on CharaForge.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   {userStats ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <StatCard icon={<Swords />} label="Characters Created" value={userStats.charactersCreated} />
                            <StatCard icon={<Heart />} label="Total Likes Received" value={userStats.totalLikes} />
                            <StatCard icon={<Gem />} label="Subscription Tier" value={userStats.subscriptionTier} />
                            <StatCard icon={<User />} label="Collections Created" value={userStats.collectionsCreated} />
                            <StatCard icon={<Package />} label="DataPacks Installed" value={userStats.installedPacks} />
                            <StatCard icon={<Calendar />} label="Member Since" value={memberSinceDate} />
                        </div>
                   ) : (
                     <p className="text-muted-foreground">Statistics are not available yet. Please check back later.</p>
                   )}
                </CardContent>
            </Card>
        </TabsContent>
         <TabsContent value="security" className="space-y-4">
           <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>
                Change your password here. For security, this feature is not yet fully implemented.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
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
              <CardDescription>
                Permanently delete your account and all of your content. This action is not reversible.
              </CardDescription>
            </CardHeader>
            <CardContent>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={isSubmitting}>Delete My Account</Button>
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
                        <AlertDialogAction onClick={handleDeleteAccount} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Continue
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
