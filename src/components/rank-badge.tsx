
'use client';

import { cn } from '@/lib/utils';

interface RankBadgeProps {
    rank: number;
}

export function RankBadge({ rank }: RankBadgeProps) {
    const colors: { [key: number]: string } = {
        1: 'bg-yellow-500/20 text-yellow-300 border-yellow-500', // Gold
        2: 'bg-sky-400/20 text-sky-300 border-sky-400', // Silver
        3: 'bg-amber-600/20 text-amber-500 border-amber-600', // Bronze
    };
    const defaultColor = 'bg-slate-600/20 text-slate-400 border-slate-500'; // Iron
    const color = colors[rank] || defaultColor;

    return (
        <div className={cn("flex items-center justify-center h-10 w-10 shrink-0 border", color)} style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
            <span className="font-bold text-sm z-10">#{rank}</span>
        </div>
    );
}
