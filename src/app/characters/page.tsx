
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { getCharacters } from '../actions/characters';
import { Button, buttonVariants } from '@/components/ui/button';
import { BackButton } from '@/components/back-button';
import type { Character } from '@/types/character';
import { cn } from '@/lib/utils';
import { Loader2, User, Swords, Layers, GitBranch } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


export default function CharactersPage() {
  const { authUser, loading: authLoading } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const groupCharacters = useCallback((chars: Character[]): Character[][] => {
      const groups = new Map<string, Character[]>();
      chars.forEach(char => {
          const baseId = char.baseCharacterId || char.id;
          if (!groups.has(baseId)) {
              groups.set(baseId, []);
          }
          groups.get(baseId)!.push(char);
      });
      return Array.from(groups.values()).sort((a, b) => {
          const lastA = a.reduce((latest, curr) => new Date(curr.createdAt) > new Date(latest.createdAt) ? curr : latest);
          const lastB = b.reduce((latest, curr) => new Date(curr.createdAt) > new Date(latest.createdAt) ? curr : latest);
          return new Date(lastB.createdAt).getTime() - new Date(lastA.createdAt).getTime();
      });
  }, []);
  
  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      router.push('/login');
      return;
    }
    
    async function fetchCharacters() {
        setLoading(true);
        try {
        const fetchedCharacters = await getCharacters();
        setCharacters(fetchedCharacters);
        } catch (error) {
        console.error("Failed to fetch characters:", error);
        } finally {
        setLoading(false);
        }
    }

    fetchCharacters();
  }, [authUser, authLoading, router]);
  
  const characterGroups = groupCharacters(characters);
  
  if (authLoading || loading) {
     return (
      <div className="flex items-center justify-center h-screen w-full">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8">
        <BackButton 
            title="My Characters"
            description="Your personal collection of forged characters."
        />
      
      <div className="max-w-7xl mx-auto">
          {characterGroups.length > 0 ? (
                <motion.div 
                    className="space-y-8"
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: {},
                        visible: {
                            transition: {
                                staggerChildren: 0.1,
                            },
                        },
                    }}
                >
                    {characterGroups.map(group => {
                        const latestVersion = group.sort((a,b) => b.version - a.version)[0];
                        const olderVersions = group.filter(c => c.id !== latestVersion.id).sort((a,b) => b.version - a.version);
                        const isBranched = group.some(v => !!v.branchedFromId);

                        return (
                            <motion.div
                                key={latestVersion.baseCharacterId || latestVersion.id}
                                variants={{
                                    hidden: { opacity: 0, y: 20 },
                                    visible: { opacity: 1, y: 0 },
                                }}
                                className="group relative"
                            >
                                <Link href={`/characters/${latestVersion.id}/edit`}>
                                    <div className="relative grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 rounded-lg overflow-hidden border bg-card/50 p-4 transition-all duration-300 hover:bg-card-highlight hover:border-primary hover:shadow-xl hover:shadow-primary/10">
                                        {/* Main Image */}
                                        <div className="md:col-span-1 lg:col-span-1">
                                            <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-muted/20">
                                                <Image src={latestVersion.imageUrl} alt={latestVersion.name} fill className="object-contain transition-transform group-hover:scale-105" />
                                            </div>
                                        </div>

                                        {/* Details and Versions */}
                                        <div className="md:col-span-2 lg:col-span-3 flex flex-col justify-center">
                                            <div className="flex items-center gap-2">
                                                <h2 className="text-2xl font-bold font-headline">{latestVersion.name}</h2>
                                                <Badge variant="secondary">{latestVersion.versionName}</Badge>
                                            </div>
                                            <p className="text-muted-foreground line-clamp-2 mt-2">{latestVersion.description}</p>
                                            
                                            {olderVersions.length > 0 && (
                                                <div className="mt-4">
                                                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">Other Versions</h4>
                                                     <div className="flex items-center gap-2 flex-wrap">
                                                        {olderVersions.map(v => (
                                                            <TooltipProvider key={v.id}>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                         <Link href={`/characters/${v.id}/edit`} className="block">
                                                                            <div className="h-12 w-12 rounded-md border-2 border-muted/50 overflow-hidden relative transition-all hover:border-primary hover:scale-110">
                                                                                <Image src={v.imageUrl} alt={v.name} fill className="object-cover" />
                                                                                 <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                                                                    <p className="text-white font-bold text-xs">{v.versionName}</p>
                                                                                </div>
                                                                            </div>
                                                                        </Link>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>Edit {v.name} {v.versionName}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Badges top right */}
                                         <div className="absolute top-2 right-2 flex items-center gap-1">
                                            {isBranched && (
                                                <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Badge variant="secondary" className="flex items-center gap-1 bg-purple-500/20 text-purple-300 border-purple-500/50">
                                                            <GitBranch className="h-3 w-3" /> Branch
                                                        </Badge>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>This character is a branch of another creation.</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                            )}
                                        </div>

                                    </div>
                                </Link>
                            </motion.div>
                        )
                    })}
                </motion.div>
          ) : (
              <div className="col-span-full w-full flex flex-col items-center justify-center text-center text-muted-foreground p-8 min-h-[400px] border-2 border-dashed rounded-lg bg-card/50">
                  <User className="h-16 w-16 mb-4 text-primary/70" />
                  <h2 className="text-2xl font-medium font-headline tracking-wider mb-2">Your Gallery is Empty</h2>
                  <p className="max-w-xs mx-auto mb-6">It looks like you haven't forged any characters yet. Let's bring your first legend to life!</p>
                  <Link href="/character-generator" className={cn(buttonVariants({ size: 'lg' }), "bg-accent text-accent-foreground hover:bg-accent/90")}>
                      <Swords className="mr-2 h-5 w-5" />
                      Forge a New Character
                  </Link>
              </div>
          )}
      </div>
    </div>
  );
}
