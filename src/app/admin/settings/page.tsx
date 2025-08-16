'use client';

import { useActionState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateLogo, type ActionResponse } from './actions';
import { useToast } from '@/hooks/use-toast';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { SubmitButton } from '@/components/ui/submit-button';


export default function AdminSettingsPage() {
    const { toast } = useToast();
    const initialState: ActionResponse = { success: false, message: '' };
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
        <AdminPageLayout title="Site Settings">
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
                        <SubmitButton>Upload Logo</SubmitButton>
                    </form>
                </CardContent>
            </Card>
        </AdminPageLayout>
    );
}
