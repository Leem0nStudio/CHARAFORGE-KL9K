
'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Clapperboard } from 'lucide-react';

interface MediaDisplayProps {
    url?: string | null;
    type?: 'image' | 'video';
    alt: string;
    className?: string;
}

export function MediaDisplay({ url, type, alt, className }: MediaDisplayProps) {
    if (!url) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-muted/50 text-muted-foreground">
                <Clapperboard className="w-12 h-12" />
            </div>
        )
    }

    if (type === 'video') {
        return (
            <video
                key={url} // Add key to force re-render when URL changes
                src={url}
                autoPlay
                loop
                muted
                playsInline
                className={cn('w-full h-full object-cover', className)}
            >
                Your browser does not support the video tag.
            </video>
        );
    }
    
    // Default to image
    return (
        <Image
            src={url}
            alt={alt}
            fill
            className={cn('w-full h-full object-cover', className)}
            sizes="(max-width: 768px) 50vw, 33vw"
        />
    );
}
