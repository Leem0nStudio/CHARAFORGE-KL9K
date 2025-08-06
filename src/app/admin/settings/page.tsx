'use client';

import { useActionState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateLogo } from './actions';
import { useToast } from '@/hooks/use-toast';
import { SubmitButton } from './submit-button';


export default function AdminSettingsPage() {
    const { toast } = useToast();
    const initialState = { success: false, message: '' };
    const [state, formAction] = useActionState(updateLogo, initialState);

    useEffect(() => {
        if (state.message) {
            toast({
                title: state.success ? 'Success!' : 'Error',
                description: state.message,
                variant: state.success ? 'default' : 'destructive',
            });
        }
    }, [state, toast]);

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <h1 className="text-3xl font-bold tracking-tight font-headline">Site Settings</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Logo Management</CardTitle>
                    <CardDescription>Upload or change the site logo. The image should be in PNG format and will be displayed in the header.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="space-y-4 max-w-md">
                        <div className="space-y-2">
                             <Label htmlFor="logo">Logo Image (PNG only)</Label>
                             <Input id="logo" name="logo" type="file" accept="image/png" required />
                        </div>
                        <SubmitButton />
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
