
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Wand2 } from 'lucide-react';
import type { DataPack } from '@/types/datapack';

interface DataPacksTabProps {
    packs: DataPack[];
    isLoading: boolean;
}

export function DataPacksTab({ packs, isLoading }: DataPacksTabProps) {

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Installed DataPacks</CardTitle>
                    <CardDescription>The creative building blocks you've collected. Use them in the Character Generator.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Installed DataPacks</CardTitle>
                <CardDescription>The creative building blocks you've collected. Use them in the Character Generator.</CardDescription>
            </CardHeader>
            <CardContent>
                {packs.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-4">
                        {packs.map(pack => (
                            <div key={pack.id} className="border p-4 rounded-lg flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold">{pack.name}</h3>
                                    <p className="text-sm text-muted-foreground">by {pack.author}</p>
                                </div>
                                <Button asChild variant="secondary" size="sm">
                                    <Link href={`/character-generator?packId=${pack.id}`}>
                                        <Wand2 className="mr-2 h-4 w-4" /> Use
                                    </Link>
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                     <div className="text-center text-muted-foreground py-12">
                        <p className="mb-4">You haven't installed any DataPacks yet.</p>
                        <Button asChild>
                            <Link href="/datapacks">Browse Catalog</Link>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
