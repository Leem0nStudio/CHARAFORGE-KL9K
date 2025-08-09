
'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { branchCharacter } from '@/app/actions/characters';
import { Button } from '@/components/ui/button';
import { GitBranch, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function BranchButton({ characterId, isIcon = false }: { characterId: string, isIcon?: boolean }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const { toast } = useToast();

    const handleBranch = () => {
        startTransition(async () => {
            const result = await branchCharacter(characterId);
            if (result.success) {
                toast({
                    title: 'Success!',
                    description: result.message,
                });
                router.push(`/characters?id=${result.characterId}`);
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Branching Failed',
                    description: result.message,
                });
            }
        });
    };
    
    if (isIcon) {
        return (
             <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="secondary" size="icon" onClick={handleBranch} disabled={isPending}>
                        {isPending ? <Loader2 className="animate-spin" /> : <GitBranch />}
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>Branch this Character</p></TooltipContent>
            </Tooltip>
        )
    }

    return (
        <Button onClick={handleBranch} disabled={isPending} className="w-full">
            {isPending ? <Loader2 className="mr-2 animate-spin" /> : <GitBranch className="mr-2" />}
            Branch this Character
        </Button>
    );
}
