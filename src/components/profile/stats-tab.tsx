
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Swords, Heart, Package, Gem, Calendar } from 'lucide-react';
import type { UserProfile } from '@/types/user';
import { format } from 'date-fns';
import { StatCard } from '@/components/ui/stat-card';

export function StatsTab({ userStats }: { userStats?: UserProfile['stats'] }) {
    const memberSince = userStats?.memberSince;
    let memberSinceDate = 'N/A';
    // Ensure memberSince is a number before creating a Date object
    if (typeof memberSince === 'number') {
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
