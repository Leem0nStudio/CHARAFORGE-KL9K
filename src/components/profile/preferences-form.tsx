'use client';

import { useState, useTransition, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { updateUserPreferences } from '@/app/actions/user';
import { Loader2 } from 'lucide-react';
import type { UserPreferences } from '@/types/user';

export function PreferencesForm({ initialPreferences }: { initialPreferences: UserPreferences }) {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<UserPreferences>(initialPreferences);
  const [isSavingPrefs, startPrefsTransition] = useTransition();

  useEffect(() => {
    setPreferences(initialPreferences);
  }, [initialPreferences]);


  const handlePreferencesChange = (field: keyof UserPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedPreferencesChange = (parent: 'notifications' | 'privacy', field: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent] as any),
        [field]: value,
      },
    }));
  };

  const handleSavePreferences = () => {
    startPrefsTransition(async () => {
      const result = await updateUserPreferences(preferences);
      if (result.success) {
        toast({ title: 'Preferences Saved', description: result.message });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };

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
