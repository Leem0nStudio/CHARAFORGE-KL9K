import { User } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function CharactersPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex-1 p-4 md:p-10">
        <div className="mx-auto grid w-full max-w-6xl gap-2">
          <h1 className="text-3xl font-semibold">My Characters</h1>
        </div>
        <div className="mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
          <nav
            className="grid gap-4 text-sm text-muted-foreground"
          >
          </nav>
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Creations</CardTitle>
                <CardDescription>
                  A gallery of all the characters you have forged.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 min-h-[300px] border-2 border-dashed rounded-lg bg-card">
                    <User className="h-12 w-12 mb-4 text-primary" />
                    <p className="text-lg font-medium font-headline tracking-wider">No characters yet</p>
                    <p className="text-sm">Go to the homepage to start creating!</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
