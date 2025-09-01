

"use client";

import Link from 'next/link';
import Image from 'next/image';
import { User, ImagePlus } from "lucide-react";
import type { Character } from "@/types/character";
import { SectionTitle } from "@/components/section-title";
import { CharacterCard } from "@/components/character/character-card";
import { BackButton } from "@/components/back-button";
import { CharacterImageActions } from "@/components/character/character-image-actions";

interface CharacterPageClientProps {
  character: Character;
  currentUserId: string | null;
  creationsForDataPack: Character[];
}

export function CharacterPageClient({
  character,
  currentUserId,
  creationsForDataPack,
}: CharacterPageClientProps) {
  const isOwner = currentUserId === character.meta.userId;
  const showRelatedCreations = creationsForDataPack.length > 0;

  return (
    <div className="container relative max-w-7xl pb-16">
      <div className="absolute left-0 top-0 mt-8">
        <BackButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8 pt-8 md:pt-24">
        {/* Image Column */}
        <div className="md:col-span-2">
          <div className="relative w-full aspect-square rounded-lg overflow-hidden shadow-lg border-2 border-primary/50 bg-muted/20">
            {character.visuals.imageUrl ? (
              <Image
                src={character.visuals.imageUrl}
                alt={character.core.name || "Character image"}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full bg-muted text-muted-foreground">
                <ImagePlus className="w-16 h-16" />
              </div>
            )}
          </div>
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <CharacterImageActions 
              character={character}
              currentUserId={currentUserId}
              isOwner={isOwner}
            />
          </div>
        </div>

        {/* Details Column */}
        <div className="md:col-span-3">
          <div className="flex items-baseline mb-2">
            <h1 className="font-headline text-4xl sm:text-5xl font-bold text-primary mr-3">
              {character.core.name}
            </h1>
            {isOwner && (
              <span className="text-sm text-muted-foreground">(Your creation)</span>
            )}
          </div>

          <div className="mb-6 text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
            <Link href={`/users/${character.meta.userId}`} className="flex items-center gap-1 hover:text-primary">
                <User className="w-4 h-4"/> <span>by {character.meta.userName || "Unknown User"}</span>
            </Link>
            {character.meta.dataPackName && (
              <>
                <span className="mx-1">•</span>
                 <Link href={`/datapacks/${character.meta.dataPackId}`} className="hover:text-primary">
                    <span>From DataPack: {character.meta.dataPackName}</span>
                 </Link>
              </>
            )}
          </div>

          <SectionTitle title="Biography" subtitle="The character's story and background."/>
          <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
            {character.core.biography.split('\n').filter(p => p.trim() !== '').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>

      {showRelatedCreations && (
        <div className="mt-16">
          <SectionTitle title="More from this DataPack" subtitle="Other creations from the community using this DataPack." />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {creationsForDataPack.map((creation) => (
              <CharacterCard key={creation.id} character={creation} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
