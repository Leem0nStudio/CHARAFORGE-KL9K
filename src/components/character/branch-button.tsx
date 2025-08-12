
'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { branchCharacter } from '@/app/actions/character-versioning';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Loader2, GitBranch } from 'lucide-react';

interface BranchButtonProps {
    characterId: string;
    isIcon?: boolean;
}

export function BranchButton({ characterId, isIcon = false }: BranchButtonProps) {
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
                // Redirect to the user's character list to see the new branch
                router.push(`/characters`);
                router.refresh();
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
