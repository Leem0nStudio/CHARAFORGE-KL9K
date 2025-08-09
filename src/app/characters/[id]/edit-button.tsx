
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Pencil } from 'lucide-react';

export function EditButton({ characterId }: { characterId: string }) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="secondary" size="icon" asChild>
                    <Link href={`/characters/${characterId}/edit`}>
                        <Pencil />
                    </Link>
                </Button>
            </TooltipTrigger>
            <TooltipContent><p>Edit Character</p></TooltipContent>
        </Tooltip>
    );
}
