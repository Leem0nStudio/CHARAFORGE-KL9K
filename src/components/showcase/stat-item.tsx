

'use client';

import { cn } from "@/lib/utils";
import React from "react";

interface StatItemProps {
    label: string;
    value: string;
    className?: string;
    icon?: React.ReactNode;
}

export function StatItem({ label, value, className, icon }: StatItemProps) {
    return (
        <div className={cn("flex flex-col", className)}>
            <span className="text-muted-foreground text-xs uppercase font-semibold flex items-center gap-1">{icon}{label}</span>
            <span className="font-medium capitalize">{value}</span>
        </div>
    )
}
