
'use client';

import { cn } from '@/lib/utils';

interface RankBadgeProps {
    rank: number;
}

export function RankBadge({ rank }: RankBadgeProps) {
    const colors: { [key: number]: string } = {
        1: 'bg-blue-600/20 text-blue-400 border-blue-500',
        2: 'bg-amber-600/20 text-amber-400 border-amber-500',
        3: 'bg-orange-700/20 text-orange-400 border-orange-500',
    };
    const defaultColor = 'bg-slate-600/20 text-slate-400 border-slate-500';
    const color = colors[rank] || defaultColor;

    return (
        <div className={cn("flex items-center justify-center h-10 w-10 shrink-0 border", color)} style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
            <span className="font-bold text-sm z-10">#{rank}</span>
        </div>
    );
}
