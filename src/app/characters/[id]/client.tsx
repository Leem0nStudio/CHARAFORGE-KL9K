
"use client";

import { Character } from "@/types/character";
import { UserProfile } from "@/types/user";
import { SectionTitle } from "@/components/section-title";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Pencil, ImagePlus } from "lucide-react";
import { CharacterCard } from "@/components/character/character-card";
import Link from "next/link";
import { BackButton } from "@/components/back-button";
import { SiteFooter } from "@/components/site-footer";
import { CharacterImageActions } from "@/components/character/character-image-actions";

interface CharacterPageClientProps {
  character: Character;
  userProfile: UserProfile | null;
  showAdminFeatures: boolean;
  creationsForDataPack: Character[];
}

export function CharacterPageClient({
  character,
  userProfile,
  showAdminFeatures,
  creationsForDataPack,
}: CharacterPageClientProps) {
  const isOwner = userProfile?.uid === character.userId;
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
            {character.imageUrl ? (
              <Image
                src={character.imageUrl}
                alt={character.name || "Character image"}
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
              currentUserId={userProfile?.uid || null}
              isOwner={isOwner}
            />
          </div>
        </div>

        {/* Details Column */}
        <div className="md:col-span-3">
          <div className="flex items-baseline mb-2">
            <h1 className="font-headline text-4xl sm:text-5xl font-bold text-primary mr-3">
              {character.name}
            </h1>
            {isOwner && (
              <span className="text-sm text-muted-foreground">(Your creation)</span>
            )}
          </div>

          <div className="mb-6 text-sm text-muted-foreground flex items-center gap-2">
            <span>Created by: {character.userName || "Unknown User"}</span>
            {character.dataPackName && (
              <>
                <span className="mx-1">•</span>
                <span>From DataPack: {character.dataPackName}</span>
              </>
            )}
            {character.tags && character.tags.length > 0 && (
              <>
                <span className="mx-1">•</span>
                <span>Tags: {character.tags.join(", ")}</span>
              </>
            )}
          </div>

          <SectionTitle title="Biography" subtitle="The character's story and background."/>
          <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
            {character.biography.split('\n').filter(p => p.trim() !== '').map((paragraph, index) => (
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

      {showAdminFeatures && (
        <div className="mt-16 border-t pt-8">
          <SectionTitle title="Admin Info" subtitle="Debugging and administrative information."/>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <p><strong>Character ID:</strong> {character.id}</p>
              <p><strong>User ID:</strong> {character.userId}</p>
              <p><strong>DataPack ID:</strong> {character.dataPackId || "N/A"}</p>
            </div>
            <div>
              <p><strong>Created At:</strong> {new Date(character.createdAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
      <SiteFooter />
    </div>
  );
}
