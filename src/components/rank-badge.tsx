
'use client';

import { cn } from '@/lib/utils';

interface RankBadgeProps {
    rank: number;
}

export function RankBadge({ rank }: RankBadgeProps) {
    const colors: { [key: number]: string } = {
        1: 'bg-amber-400/20 text-amber-300 border-amber-400',
        2: 'bg-slate-400/20 text-slate-300 border-slate-400',
        3: 'bg-orange-600/20 text-orange-400 border-orange-500',
    };
    const defaultColor = 'bg-slate-600/20 text-slate-400 border-slate-500';
    const color = colors[rank] || defaultColor;

    return (
        <div className={cn("flex items-center justify-center h-10 w-10 shrink-0 border", color)} style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
            <span className="font-bold text-sm z-10">#{rank}</span>
        </div>
    );
}

    