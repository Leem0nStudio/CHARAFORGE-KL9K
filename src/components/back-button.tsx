
'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BackButtonProps {
    title?: string;
    description?: string;
}

export function BackButton({ title, description }: BackButtonProps) {
  const router = useRouter();

  if (title && description) {
    return (
        <div className="mx-auto grid w-full max-w-7xl gap-2 mb-8">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back</span>
                </Button>
                <div>
                    <h1 className="text-3xl font-semibold font-headline tracking-wider">{title}</h1>
                    <p className="text-muted-foreground">{description}</p>
                </div>
            </div>
        </div>
    );
  }

  return (
    <Button variant="outline" size="icon" onClick={() => router.back()}>
      <ArrowLeft className="h-4 w-4" />
      <span className="sr-only">Back</span>
    </Button>
  );
}
