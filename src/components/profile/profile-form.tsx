
'use client';

import { useEffect, useState, useActionState, ChangeEvent } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { updateUserProfile, type ActionResponse } from '@/app/actions/user';
import type { UserProfile } from '@/types/user';
import { Camera, Copy } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SubmitButton } from '@/components/ui/submit-button';

export function ProfileForm({ user }: { user: UserProfile }) {
  const { toast } = useToast();
  const { setUserProfile } = useAuth();
  const initialState: ActionResponse = { success: false, message: '' };
  const [state, formAction] = useActionState(updateUserProfile, initialState);
  const [preview, setPreview] = useState<string | null>(user.photoURL);

  useEffect(() => {
    setPreview(user.photoURL);
  }, [user.photoURL]);

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({ title: 'Success!', description: state.message });
        if (state.newAvatarUrl) {
          // Update the auth context so the UI reflects the change immediately
          setUserProfile(prev => prev ? { ...prev, photoURL: state.newAvatarUrl || null } : null);
        }
      } else {
        toast({ variant: 'destructive', title: 'Update Failed', description: state.error || state.message });
      }
    }
  }, [state, toast, setUserProfile]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const fallback = user.displayName?.charAt(0) || user.email?.charAt(0) || '?';

  const copyUid = () => {
    navigator.clipboard.writeText(user.uid);
    toast({ title: 'UID Copied!', description: 'Your User ID has been copied to the clipboard.'})
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Public Profile</CardTitle>
        <CardDescription>This is how others will see you on the site.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
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

            <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input 
                    id="displayName" 
                    name="displayName" 
                    defaultValue={user.displayName || ''}
                    required
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={user.email || ''} disabled />
            </div>
             <div className="space-y-2">
                <Label htmlFor="uid">User ID</Label>
                <div className="flex items-center gap-2">
                    <Input id="uid" type="text" value={user.uid} readOnly disabled />
                    <Button type="button" variant="outline" size="icon" onClick={copyUid}><Copy className="w-4 h-4"/></Button>
                </div>
                <p className="text-xs text-muted-foreground">Your unique identifier. Needed for admin commands.</p>
            </div>
            <div className="space-y-2">
                <Label htmlFor="bio">Biography</Label>
                <Textarea 
                    id="bio" 
                    name="bio" 
                    defaultValue={user.profile?.bio || ''}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    maxLength={500}
                />
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Social Links</h3>
                <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter URL</Label>
                    <Input 
                        id="twitter" 
                        name="socialLinks.twitter" 
                        defaultValue={user.profile?.socialLinks?.twitter || ''}
                        placeholder="https://twitter.com/yourprofile"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="artstation">ArtStation URL</Label>
                    <Input 
                        id="artstation" 
                        name="socialLinks.artstation" 
                        defaultValue={user.profile?.socialLinks?.artstation || ''}
                        placeholder="https://www.artstation.com/yourprofile"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="website">Website URL</Label>
                    <Input 
                        id="website" 
                        name="socialLinks.website" 
                        defaultValue={user.profile?.socialLinks?.website || ''}
                        placeholder="https://yourwebsite.com"
                    />
                </div>
            </div>

            <SubmitButton>Update Profile</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
