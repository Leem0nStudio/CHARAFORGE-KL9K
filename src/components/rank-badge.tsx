// PLAN: Create a new component for displaying user ranks.
// This will not be a standard circular or square badge.
// It will be a stylized hexagonal badge to fit the "gamified" UI theme.
// The color of the badge will change based on the rank:
// - Rank 1: Gold
// - Rank 2: Silver
// - Rank 3: Bronze
// - Other Ranks: Iron/Default color
// This component will be used in the new "Top Creators" section on the home page.
'use client';

import { cn } from '@/lib/utils';

interface RankBadgeProps {
    rank: number;
}

export function RankBadge({ rank }: RankBadgeProps) {
    // TODO: Implement hexagonal shape and rank-based colors.
    return (
        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
            <span className="font-bold">#{rank}</span>
        </div>
    );
}
