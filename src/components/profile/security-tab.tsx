
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
import { Loader2, KeyRound, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { UserPreferences } from '@/types/user';
import Link from 'next/link';
import { Separator } from '../ui/separator';
import { cn } from '@/lib/utils';

export function SecurityTab() {
  const { toast } = useToast();
  const router = useRouter();
  const { userProfile, setUserProfile } = useAuth();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isSavingPrefs, startPrefsTransition] = useTransition();

  const [huggingFaceApiKey, setHuggingFaceApiKey] = useState(userProfile?.preferences?.huggingFaceApiKey || '');
  const [openRouterApiKey, setOpenRouterApiKey] = useState(userProfile?.preferences?.openRouterApiKey || '');

  const hasHfKey = !!userProfile?.preferences?.huggingFaceApiKey;
  const hasOrKey = !!userProfile?.preferences?.openRouterApiKey;


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

  const handleClearKey = (keyType: 'huggingFace' | 'openRouter') => {
      if(keyType === 'huggingFace') setHuggingFaceApiKey('');
      if(keyType === 'openRouter') setOpenRouterApiKey('');
      // The user still needs to press save to confirm the change
      toast({ title: "Key Cleared", description: "Press 'Save API Keys' to confirm this change."})
  }


  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>Provide your own API keys to use if the system's keys are rate-limited or to access premium models.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <Label htmlFor="hf-api-key" className="flex items-center gap-2">
                        <KeyRound /> Hugging Face API Key
                    </Label>
                     <Link href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                        <Info className="h-3 w-3" /> Where do I find this?
                    </Link>
                </div>
                <div className="flex items-center gap-2">
                    <Input 
                        id="hf-api-key" 
                        type="password" 
                        placeholder={hasHfKey ? '•••••••••••••••••••••••' : 'Enter your key...'}
                        value={huggingFaceApiKey}
                        onChange={(e) => setHuggingFaceApiKey(e.target.value)}
                        className="flex-grow"
                    />
                    {hasHfKey && <Button variant="ghost" type="button" onClick={() => handleClearKey('huggingFace')}>Clear</Button>}
                </div>
                 <div className={cn("flex items-center text-xs gap-2", hasHfKey ? "text-green-500" : "text-amber-500")}>
                    {hasHfKey ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4"/>}
                    {hasHfKey ? "Key Configured" : "No Key Set"}
                </div>
            </div>
            
            <Separator />

             <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <Label htmlFor="or-api-key" className="flex items-center gap-2">
                        <KeyRound /> OpenRouter API Key
                    </Label>
                     <Link href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                        <Info className="h-3 w-3" /> Where do I find this?
                    </Link>
                </div>
                 <div className="flex items-center gap-2">
                    <Input 
                        id="or-api-key" 
                        type="password" 
                        placeholder={hasOrKey ? '•••••••••••••••••••••••' : 'Enter your key...'}
                        value={openRouterApiKey}
                        onChange={(e) => setOpenRouterApiKey(e.target.value)}
                    />
                     {hasOrKey && <Button variant="ghost" type="button" onClick={() => handleClearKey('openRouter')}>Clear</Button>}
                </div>
                <div className={cn("flex items-center text-xs gap-2", hasOrKey ? "text-green-500" : "text-amber-500")}>
                    {hasOrKey ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4"/>}
                    {hasOrKey ? "Key Configured" : "No Key Set"}
                </div>
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
