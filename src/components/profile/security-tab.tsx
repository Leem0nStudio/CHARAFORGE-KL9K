
'use client';

import { useTransition, useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { deleteUserAccount, updateUserPreferences } from '@/app/actions/user';
import { Loader2, KeyRound } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { UserPreferences } from '@/types/user';

export function SecurityTab() {
  const { toast } = useToast();
  const router = useRouter();
  const { userProfile, setUserProfile } = useAuth();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isSavingPrefs, startPrefsTransition] = useTransition();

  const [huggingFaceApiKey, setHuggingFaceApiKey] = useState(userProfile?.preferences?.huggingFaceApiKey || '');

  const handleDeleteAccount = () => {
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
  };

  const handleSavePreferences = () => {
    startPrefsTransition(async () => {
        if (!userProfile?.preferences) return;
        const newPreferences: UserPreferences = {
            ...userProfile.preferences,
            huggingFaceApiKey: huggingFaceApiKey,
        }
        const result = await updateUserPreferences(newPreferences);
        if (result.success) {
            toast({ title: "Preferences Saved!", description: result.message });
            // Optimistically update the context
            setUserProfile(prev => prev ? ({ ...prev, preferences: newPreferences }) : null);
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
      }
    });
  };


  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>Provide your own API keys to use as a fallback if the system's keys are rate-limited.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="hf-api-key" className="flex items-center gap-2">
                    <KeyRound /> Hugging Face API Key
                </Label>
                <Input 
                    id="hf-api-key" 
                    type="password" 
                    placeholder="hf_..."
                    value={huggingFaceApiKey}
                    onChange={(e) => setHuggingFaceApiKey(e.target.value)}
                />
            </div>
            <Button onClick={handleSavePreferences} disabled={isSavingPrefs}>
                {isSavingPrefs && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save API Key
            </Button>
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
