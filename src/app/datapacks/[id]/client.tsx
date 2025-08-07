
'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { installDataPack } from '@/app/actions/datapacks';
import { Wand2, Download, ShoppingCart, Loader2, Check } from 'lucide-react';
import type { DataPack } from '@/types/datapack';

export function DataPackClient({ pack }: { pack: DataPack; }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const router = useRouter();
    const { authUser, userProfile } = useAuth();

    const isInstalled = userProfile?.stats?.installedPacks?.includes(pack.id) ?? false;

    const handleInstall = () => {
        if (!authUser) {
            router.push('/login');
            return;
        }

        startTransition(async () => {
            const result = await installDataPack(pack.id);
            toast({
                title: result.success ? 'Success!' : 'Error',
                description: result.message,
                variant: result.success ? 'default' : 'destructive',
            });
            if (result.success) {
                // Force a page refresh to get the latest user profile and update the button state
                router.refresh();
            }
        });
    };

    const handlePurchase = () => {
        if (!authUser) {
            router.push('/login');
            return;
        }
        toast({
            title: 'Coming Soon!',
            description: 'The marketplace for premium packs is under construction.',
        });
    };
    
    const renderButtons = () => {
        if (isInstalled) {
            return (
                 <div className="flex items-center gap-2 text-green-500 font-semibold">
                    <Check />
                    <span>Installed</span>
                </div>
            )
        }

        if (pack.type === 'premium') {
             return (
                 <Button onClick={handlePurchase} className="w-full md:w-auto" disabled={isPending} size="lg">
                    <ShoppingCart className="mr-2" /> Purchase for ${pack.price}
                </Button>
            )
        }

        return (
            <Button onClick={handleInstall} className="w-full md:w-auto" disabled={isPending} size="lg">
                {isPending ? (
                    <Loader2 className="mr-2 animate-spin" />
                ) : (
                    <Download className="mr-2" />
                )}
                Install for Free
            </Button>
        )
    };
    
    return (
        <div className="mt-6 flex items-center gap-4">
           {renderButtons()}
           <Button asChild className="w-full md:w-auto" size="lg" variant="secondary">
                <Link href="/character-generator">
                    <Wand2 className="mr-2" /> Go to Generator
                </Link>
            </Button>
        </div>
    )
}
