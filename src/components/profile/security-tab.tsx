
'use client';

import { useTransition, useEffect, useState } from 'react';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { deleteUserAccount, updateUserPreferences } from '@/app/actions/user';
import { Loader2, KeyRound, Info } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { UserPreferences } from '@/types/user';
import Link from 'next/link';
import { Separator } from '../ui/separator';

export function SecurityTab() {
  const { toast } = useToast();
  const router = useRouter();
  const { userProfile, setUserProfile } = useAuth();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isSavingPrefs, startPrefsTransition] = useTransition();

  const [huggingFaceApiKey, setHuggingFaceApiKey] = useState(userProfile?.preferences?.huggingFaceApiKey || '');
  const [openRouterApiKey, setOpenRouterApiKey] = useState(userProfile?.preferences?.openRouterApiKey || '');

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
            openRouterApiKey: openRouterApiKey,
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
          <CardDescription>Provide your own API keys to use as a fallback if the system's keys are rate-limited or to access premium models.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
                 <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Where to find your API Key?</AlertTitle>
                    <AlertDescription>
                        Using your own key can prevent generation failures if the system key is busy. You can create a free key in your Hugging Face account settings.
                        <Button variant="link" asChild className="p-0 h-auto ml-1 font-semibold">
                            <Link href="https://huggingface.co/settings/tokens" target="_blank">Get your key here.</Link>
                        </Button>
                    </AlertDescription>
                </Alert>
            </div>
            
            <Separator />

             <div className="space-y-2">
                <Label htmlFor="or-api-key" className="flex items-center gap-2">
                    <KeyRound /> OpenRouter API Key
                </Label>
                <Input 
                    id="or-api-key" 
                    type="password" 
                    placeholder="sk-or-..."
                    value={openRouterApiKey}
                    onChange={(e) => setOpenRouterApiKey(e.target.value)}
                />
                 <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Where to find your API Key?</AlertTitle>
                    <AlertDescription>
                       OpenRouter provides access to models like DALL-E 3 and SDXL Turbo.
                        <Button variant="link" asChild className="p-0 h-auto ml-1 font-semibold">
                            <Link href="https://openrouter.ai/keys" target="_blank">Get your key here.</Link>
                        </Button>
                    </AlertDescription>
                </Alert>
            </div>

            <Button onClick={handleSavePreferences} disabled={isSavingPrefs}>
                {isSavingPrefs && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save API Keys
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
