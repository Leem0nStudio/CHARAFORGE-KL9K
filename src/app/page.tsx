import Image from 'next/image';
import { Bot, Swords, Rocket, ScrollText, User } from 'lucide-react';
import { CharacterGenerator } from '@/components/character-generator';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { LoginButton } from '@/components/login-button';
import { adminDb } from '@/lib/firebase/server';
import type { Character } from '@/components/character-card';

async function getFeaturedCharacters(): Promise<Character[]> {
  try {
    const snapshot = await adminDb
      .collection('characters')
      .where('status', '==', 'public')
      .orderBy('createdAt', 'desc')
      .limit(4)
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
        userName: data.userName || 'Anonymous',
      };
    });
  } catch (error) {
    console.error("Error fetching featured characters, returning placeholder data:", error);
    // Return placeholder data on error to prevent build failures
    return [
        { id: '1', name: 'Kaelen, the Shadow Rogue', imageUrl: 'https://placehold.co/400x400.png', description: '', biography: '', userId: '', status: 'public', createdAt: new Date(), userName: 'seraphina' },
        { id: '2', name: 'Unit 734: "Glitch"', imageUrl: 'https://placehold.co/400x400.png', description: '', biography: '', userId: '', status: 'public', createdAt: new Date(), userName: 'cypher' },
        { id: '3', name: 'Captain "Iron-Eye" Isabella', imageUrl: 'https://placehold.co/400x400.png', description: '', biography: '', userId: '', status: 'public', createdAt: new Date(), userName: 'mad_max' },
        { id: '4', name: 'Lyra of the Whispering Woods', imageUrl: 'https://placehold.co/400x400.png', description: '', biography: '', userId: '', status: 'public', createdAt: new Date(), userName: 'elara' },
    ];
  }
}


const topCreators = [
    { name: 'seraphina', avatar: 'https://placehold.co/100x100.png', creations: 87 },
    { name: 'cypher', avatar: 'https://placehold.co/100x100.png', creations: 72 },
    { name: 'mad_max', avatar: 'https://placehold.co/100x100.png', creations: 65 },
    { name: 'elara', avatar: 'https://placehold.co/100x100.png', creations: 58 },
    { name: 'nexus', avatar: 'https://placehold.co/100x100.png', creations: 49 },
];

const dataPacks = [
    { name: 'High Fantasy', description: 'Elves, dwarves, and dragons.', icon: <Swords className="w-6 h-6" /> },
    { name: 'Cyberpunk Dystopia', description: 'Neon-lit streets and mega-corps.', icon: <Rocket className="w-6 h-6" /> },
    { name: 'Cosmic Horror', description: 'Unspeakable horrors from beyond.', icon: <ScrollText className="w-6 h-6" /> },
];

export default async function Home() {
  const featuredCreations = await getFeaturedCharacters();

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center">
          <div className="mr-4 flex items-center">
            <Bot className="h-6 w-6 mr-2 text-primary" />
            <span className="font-bold font-headline text-2xl tracking-wider">CharaForge</span>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <LoginButton />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="container grid items-center gap-6 pb-8 pt-10 md:py-16 text-center">
            <h1 className="text-4xl font-extrabold leading-tight tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl font-headline">
              <span className="text-primary">Forge</span> Your Legends
            </h1>
            <p className="max-w-[700px] mx-auto text-lg text-muted-foreground sm:text-xl">
              Bring your characters to life with AI-powered biographies and stunning visuals. Describe your hero, and let CharaForge do the rest.
            </p>
        </section>

        <CharacterGenerator />

        <Separator className="my-16" />

        <section id="featured-creations" className="container space-y-8 py-8 md:py-12">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="font-headline text-3xl leading-[1.1] sm:text-3xl md:text-5xl">Featured Creations</h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Explore characters crafted by the CharaForge community.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {featuredCreations.map((creation) => (
              <Card key={creation.id} className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
                <CardHeader className="p-0">
                  <Image
                    src={creation.imageUrl}
                    alt={creation.name}
                    width={400}
                    height={400}
                    className="w-full h-auto aspect-square object-cover"
                    data-ai-hint="fantasy rogue"
                  />
                </CardHeader>
                <CardContent className="p-4">
                  <CardTitle className="text-xl font-headline">{creation.name}</CardTitle>
                  <CardDescription>by @{creation.userName}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="top-creators" className="w-full bg-secondary/30 dark:bg-card py-16 my-16">
            <div className="container">
                <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center mb-8">
                    <h2 className="font-headline text-3xl leading-[1.1] sm:text-3xl md:text-5xl">Top Creators</h2>
                    <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                    Meet the masterminds behind the most epic characters.
                    </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-8 gap-x-4">
                    {topCreators.map((creator) => (
                    <div key={creator.name} className="flex flex-col items-center text-center gap-2">
                        <Avatar className="h-24 w-24 border-4 border-primary/50">
                          <AvatarImage src={creator.avatar} alt={creator.name} data-ai-hint="portrait" />
                          <AvatarFallback>{creator.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <p className="font-semibold text-lg">@{creator.name}</p>
                        <p className="text-sm text-muted-foreground">{creator.creations} Creations</p>
                    </div>
                    ))}
                </div>
            </div>
        </section>

        <section id="data-packs" className="container space-y-8 py-8 md:py-12">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="font-headline text-3xl leading-[1.1] sm:text-3xl md:text-5xl">New DataPacks</h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Expand your creative universe with new styles, genres, and attributes.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             {dataPacks.map((pack) => (
                <Card key={pack.name} className="flex flex-col transition-all hover:shadow-lg hover:-translate-y-1">
                  <CardHeader className="flex-grow">
                    <div className="flex items-start gap-4">
                       <div className="p-3 bg-primary/10 rounded-lg text-primary">{pack.icon}</div>
                       <div className="flex-1">
                         <CardTitle className="font-headline text-2xl mb-1">{pack.name}</CardTitle>
                         <CardDescription>{pack.description}</CardDescription>
                       </div>
                    </div>
                  </CardHeader>
                  <CardFooter className="pt-4">
                    <Button variant="secondary" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                      Explore Pack
                    </Button>
                  </CardFooter>
                </Card>
            ))}
          </div>
        </section>

      </main>
      <footer className="py-6 md:px-8 md:py-0 mt-16 border-t">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <div className="flex items-center gap-2">
             <Bot className="h-5 w-5 text-muted-foreground" />
            <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
              CharaForge &copy; {new Date().getFullYear()}. Forged with AI.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
