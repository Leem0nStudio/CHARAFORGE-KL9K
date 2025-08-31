
'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { installModel } from '@/app/actions/ai-models';
import { Button } from '@/components/ui/button';
import { Check, Download, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export function ModelInstallButton({ modelId }: { modelId: string }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const router = useRouter();
    const { userProfile } = useAuth();

    const isInstalled = userProfile?.preferences?.installed_models?.includes(modelId);

    const handleInstall = () => {
        if (!userProfile) {
            router.push('/login');
            return;
        }

        startTransition(async () => {
            const result = await installModel(modelId);
            if (result.success) {
                toast({ title: "Success!", description: result.message });
                router.refresh(); 
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        });
    };

    if (isInstalled) {
        return (
            <Button variant="secondary" className="w-full" disabled>
                <Check className="mr-2 h-4 w-4" /> Installed
            </Button>
        );
    }
    
    return (
        <Button onClick={handleInstall} disabled={isPending} className="w-full">
            {isPending ? <Loader2 className="animate-spin mr-2" /> : <Download className="mr-2 h-4 w-4" />}
            Install
        </Button>
    )
}

    