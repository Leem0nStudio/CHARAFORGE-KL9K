
'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { seedDataPacksFromAdmin } from '@/app/actions/datapacks';
import { Loader2, RefreshCw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useRouter } from 'next/navigation';

export function SeedDataPacksButton() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const handleSeed = () => {
    startTransition(async () => {
      const result = await seedDataPacksFromAdmin();
      if (result.success) {
        toast({ title: 'Success!', description: result.message });
        // Refresh the current route to show the updated list of datapacks
        router.refresh();
      } else {
        toast({ variant: 'destructive', title: 'Seeding Failed', description: result.error || result.message });
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Seed Local DataPacks
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to seed?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will synchronize the database with the DataPacks located in the local `/data/datapacks` directory. 
            It will delete any DataPacks from the database that do not exist locally. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSeed} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm & Seed
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
