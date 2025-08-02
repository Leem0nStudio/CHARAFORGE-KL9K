import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import Image from 'next/image';
import { User, Copy, BookOpen, Trash2, Send } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { admin } from '@/lib/firebase/server';
import { Separator } from '@/components/ui/separator';

type Character = {
  id: string;
  name: string;
  description: string;
  biography: string;
  imageUrl: string;
  userId: string;
  status: 'private' | 'public';
  createdAt: Date;
};

async function getCharactersForUser(userId: string): Promise<Character[]> {
  try {
    const snapshot = await admin.firestore()
      .collection('characters')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        description: data.description,
        biography: data.biography,
        imageUrl: data.imageUrl,
        userId: data.userId,
        status: data.status,
        createdAt: data.createdAt.toDate(),
      };
    });
  } catch (error) {
    console.error("Error fetching characters:", error);
    return [];
  }
}

export default async function CharactersPage() {
  const cookieStore = cookies();
  const idToken = cookieStore.get('firebaseIdToken')?.value;
  let characters: Character[] = [];

  if (idToken) {
    try {
      const decodedToken = await getAuth(admin).verifyIdToken(idToken);
      characters = await getCharactersForUser(decodedToken.uid);
    } catch (error) {
      console.error('Error verifying token or fetching data:', error);
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex-1 p-4 md:p-10">
        <div className="mx-auto grid w-full max-w-6xl gap-2 mb-8">
          <h1 className="text-3xl font-semibold font-headline tracking-wider">My Characters</h1>
          <p className="text-muted-foreground">A gallery of all the characters you have forged.</p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {characters.length > 0 ? (
              characters.map((character) => (
                <Card key={character.id} className="flex flex-col">
                  <CardHeader className="p-0">
                     <Image
                        src={character.imageUrl}
                        alt={character.name}
                        width={400}
                        height={400}
                        className="w-full h-auto aspect-square object-cover rounded-t-lg"
                      />
                  </CardHeader>
                  <CardContent className="p-4 flex-grow">
                    <CardTitle className="font-headline text-2xl mb-2">{character.name}</CardTitle>
                    
                    <Accordion type="single" collapsible>
                      <AccordionItem value="item-1">
                        <AccordionTrigger>
                           <span className="flex items-center gap-2 text-sm font-semibold">
                            <BookOpen className="h-4 w-4" /> Biography
                           </span>
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground text-sm space-y-3 py-2">
                           {character.biography.split('\n').filter(p => p.trim() !== '').map((paragraph, index) => (
                            <p key={index}>{paragraph}</p>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    <Separator className="my-4" />

                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Copy className="h-4 w-4" /> Original Prompt
                      </h4>
                      <p className="text-sm text-muted-foreground italic p-3 bg-muted rounded-md">
                        &quot;{character.description}&quot;
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 flex gap-2">
                     <Button variant="outline" className="w-full">
                        <Send className="h-4 w-4 mr-2"/>
                        Post to Feed
                     </Button>
                     <Button variant="destructive" className="w-full">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                     </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center text-center text-muted-foreground p-8 min-h-[400px] border-2 border-dashed rounded-lg bg-card">
                  <User className="h-12 w-12 mb-4 text-primary" />
                  <p className="text-lg font-medium font-headline tracking-wider">No characters yet</p>
                  <p className="text-sm">Go to the homepage to start creating!</p>
              </div>
            )}
        </div>
      </main>
    </div>
  );
}
