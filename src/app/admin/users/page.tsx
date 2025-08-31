
'use client';

import { useState, useTransition } from 'react';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { searchUsers, grantAdminRole, revokeAdminRole, type SanitizedUser } from '@/app/actions/admin';
import { Loader2, User, Shield, ShieldOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';

function UserManagementClient() {
    const { authUser } = useAuth();
    const { toast } = useToast();
    const [emailQuery, setEmailQuery] = useState('');
    const [users, setUsers] = useState<SanitizedUser[]>([]);
    const [isSearching, startSearchTransition] = useTransition();
    const [isUpdating, startUpdateTransition] = useTransition();

    const handleSearch = () => {
        if (!emailQuery) return;
        startSearchTransition(async () => {
            try {
                const results = await searchUsers(emailQuery);
                setUsers(results);
                if (results.length === 0) {
                    toast({ title: 'Not Found', description: 'No user found with that email address.' });
                }
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Search Failed', description: error.message });
            }
        });
    };

    const handleRoleChange = (uid: string, isAdmin: boolean) => {
        startUpdateTransition(async () => {
            const action = isAdmin ? revokeAdminRole : grantAdminRole;
            const result = await action(uid);
            if (result.success) {
                toast({ title: 'Success', description: result.message });
                // Refresh the search results to show the updated status
                handleSearch();
            } else {
                toast({ variant: 'destructive', title: 'Update Failed', description: result.error });
            }
        });
    };

    return (
        <AdminPageLayout title="User Role Management">
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Search for a User</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2">
                            <Input 
                                type="email"
                                placeholder="user@example.com"
                                value={emailQuery}
                                onChange={(e) => setEmailQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <Button onClick={handleSearch} disabled={isSearching}>
                                {isSearching && <Loader2 className="mr-2 animate-spin"/>} Search
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {users.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Search Results</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {users.map(user => (
                                    <li key={user.uid} className="flex items-center justify-between p-2 rounded-md border">
                                        <div className="flex flex-col">
                                            <span className="font-medium">{user.email}</span>
                                            <span className="text-xs text-muted-foreground">UID: {user.uid}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {user.isAdmin && <Badge variant="default"><Shield className="mr-2"/> Admin</Badge>}
                                            <Button 
                                                variant={user.isAdmin ? 'destructive' : 'outline'}
                                                size="sm"
                                                onClick={() => handleRoleChange(user.uid, user.isAdmin)}
                                                disabled={isUpdating || user.uid === authUser?.id}
                                            >
                                                {user.isAdmin ? <ShieldOff className="mr-2"/> : <Shield className="mr-2"/>}
                                                {user.isAdmin ? 'Revoke Admin' : 'Make Admin'}
                                            </Button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AdminPageLayout>
    )
}

export default function UserManagementPage() {
    return <UserManagementClient />;
}
