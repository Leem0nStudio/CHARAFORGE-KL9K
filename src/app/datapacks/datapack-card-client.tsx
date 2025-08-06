
'use client';

import { useTransition, cloneElement } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { installDataPack } from './actions';
import { Wand2, Download, ShoppingCart, Loader2, Check } from 'lucide-react';
import type { DataPack } from '@/types/datapack';

export function DataPackCardClient({ pack, children }: { pack: DataPack; children: React.ReactNode }) {
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
    
    const renderButton = () => {
        if (isInstalled) {
            return (
                 <Button asChild className="w-full" variant="secondary">
                    <Link href={`/prompt-wizard?pack=${pack.id}`}>
                        <Wand2 className="mr-2" /> Use Wizard
                    </Link>
                </Button>
            )
        }

        if (pack.type === 'premium') {
             return (
                 <Button onClick={handlePurchase} className="w-full" disabled={isPending}>
                    <ShoppingCart className="mr-2" /> Purchase
                </Button>
            )
        }

        return (
            <Button onClick={handleInstall} className="w-full" disabled={isPending}>
                {isPending ? (
                    <Loader2 className="mr-2 animate-spin" />
                ) : (
                    <Download className="mr-2" />
                )}
                Install
            </Button>
        )
    };

    // This clones the server component child and injects the client-side button into its footer
    const childWithButton = cloneElement(children as React.ReactElement, {
      children: [
        ...(Array.isArray((children as React.ReactElement).props.children) ? (children as React.ReactElement).props.children : [(children as React.ReactElement).props.children]),
        <CardFooter key="footer">{renderButton()}</CardFooter>
      ]
    });
    
    return childWithButton;
}
