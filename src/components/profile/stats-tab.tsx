
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Swords, Heart, Package, Gem, Calendar, UserPlus, UserCheck } from 'lucide-react';
import type { UserProfile } from '@/types/user';
import { format } from 'date-fns';
import { StatCard } from '@/components/ui/stat-card';

export function StatsTab({ userStats }: { userStats?: UserProfile['stats'] }) {
    const memberSince = userStats?.memberSince;
    let memberSinceDate = 'N/A';
    
    if (typeof memberSince === 'number') {
      const date = new Date(memberSince);
      if (!isNaN(date.getTime())) {
          memberSinceDate = format(date, 'PPP');
      }
    } else if (memberSince) {
      const date = new Date(memberSince);
      if (!isNaN(date.getTime())) {
          memberSinceDate = format(date, 'PPP');
      }
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
                        <StatCard icon={<Swords />} label="Characters Created" value={userStats.charactersCreated || 0} />
                        <StatCard icon={<Heart />} label="Total Likes Received" value={userStats.totalLikes || 0} />
                        <StatCard icon={<UserPlus />} label="Followers" value={userStats.followers || 0} />
                        <StatCard icon={<UserCheck />} label="Following" value={userStats.following || 0} />
                        <StatCard icon={<Package />} label="DataPacks Installed" value={userStats.installedPacks?.length || 0} />
                        <StatCard icon={<Calendar />} label="Member Since" value={memberSinceDate} />
                    </div>
               ) : (
                 <p className="text-muted-foreground">Statistics are not available yet. Please check back later.</p>
               )}
            </CardContent>
        </Card>
    );
}
