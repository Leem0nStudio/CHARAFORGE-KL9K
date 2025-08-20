

'use client';

import { cn } from "@/lib/utils";

interface StatItemProps {
    label: string;
    value: string;
    className?: string;
}

export function StatItem({ label, value, className }: StatItemProps) {
    return (
        <div className={cn("flex flex-col", className)}>
            <span className="text-muted-foreground text-xs uppercase font-semibold">{label}</span>
            <span className="font-medium capitalize">{value}</span>
        </div>
    )
}
