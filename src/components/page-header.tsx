
'use client';

import { BackButton } from '@/components/back-button';

interface PageHeaderProps {
    title: string;
    description: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
    return (
        <div className="mx-auto grid w-full max-w-7xl gap-2 mb-8">
            <div className="flex items-center gap-4">
                <BackButton />
                <div>
                    <h1 className="text-3xl font-semibold font-headline tracking-wider">{title}</h1>
                    <p className="text-muted-foreground">{description}</p>
                </div>
            </div>
        </div>
    );
}
