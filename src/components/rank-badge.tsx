
'use client';

import { cn } from '@/lib/utils';

interface RankBadgeProps {
    rank: number;
}

export function RankBadge({ rank }: RankBadgeProps) {
    
    const rankStyles = {
        1: 'bg-yellow-400 text-yellow-900 border-yellow-500',
        2: 'bg-slate-300 text-slate-800 border-slate-400',
        3: 'bg-orange-400 text-orange-900 border-orange-500',
        default: 'bg-slate-600 text-slate-100 border-slate-500',
    };

    const style = rank <= 3 ? rankStyles[rank as keyof typeof rankStyles] : rankStyles.default;

    return (
        <div className={cn("absolute -top-2 -left-2 w-10 h-10 flex items-center justify-center font-bold text-sm border-2 rounded-full shadow-lg", style)}>
            #{rank}
        </div>
    );
}
