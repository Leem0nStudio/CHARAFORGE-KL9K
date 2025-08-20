

'use client';

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
    rating: number;
    maxRating?: number;
    className?: string;
}

export function StarRating({ rating, maxRating = 5, className }: StarRatingProps) {
    return (
        <div className={cn("flex items-center", className)}>
            {Array.from({ length: maxRating }).map((_, i) => (
                <Star
                    key={i}
                    className={cn(
                        "w-5 h-5",
                        i < rating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-muted-foreground/30"
                    )}
                />
            ))}
        </div>
    );
}
