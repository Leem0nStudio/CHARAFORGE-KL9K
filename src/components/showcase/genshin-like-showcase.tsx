
'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Character } from '@/types/character';
import { Heart, Edit, User, ArrowLeft, X, Swords, Shield, BrainCircuit } from 'lucide-react';
import { LikeButton } from './like-button';

interface ShowcaseProps {
    character: Character;
    currentUserId: string | null;
    isLikedInitially: boolean;
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-[#1b2a2d] px-2.5 py-1 text-xs text-white/70 uppercase tracking-wide shadow-inner">
      {children}
    </span>
  );
}

function ActionButton({ children, variant = "solid", asChild = false, href }: { children: React.ReactNode; variant?: "solid" | "ghost"; asChild?: boolean; href?: string; }) {
  const base = "px-4 py-2 rounded-xl border text-sm font-medium tracking-wide backdrop-blur";
  const styles =
    variant === "solid"
      ? "bg-emerald-400/20 text-emerald-200 border-emerald-300/30 hover:bg-emerald-400/30"
      : "bg-transparent border-white/20 hover:bg-white/10";

  if (asChild && href) {
    return <Link href={href} className={`${base} ${styles}`}>{children}</Link>;
  }
  return <button className={`${base} ${styles}`}>{children}</button>;
}

function TalentItem({ title, level, icon, type }: { title: string; level?: number; icon?: React.ReactNode; type: 'attack' | 'defense' | 'utility' }) {
  const active = true; // For this showcase, all skills are "active"
  const iconColor = {
    attack: 'text-destructive',
    defense: 'text-blue-400',
    utility: 'text-green-400',
  }
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border mb-2 ${active ? "bg-emerald-500/15 border-emerald-400/40" : "bg-[#1a282b] border-white/10"}`}>
      <div className={`h-10 w-10 rounded-full grid place-items-center shrink-0 ${active ? "bg-emerald-400/25" : "bg-[#243335]"}`}>
        <div className={iconColor[type]}>{icon}</div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate font-medium text-white/90">{title}</p>
        {typeof level !== "undefined" && (
          <p className="text-[11px] text-white/60">Power: {level}</p>
        )}
      </div>
      <span className={`h-2 w-2 rounded-full ${active ? "bg-emerald-300" : "bg-white/30"}`} />
    </div>
  );
}

const skillIcons = {
    attack: <Swords />,
    defense: <Shield />,
    utility: <BrainCircuit />,
};


export function GenshinLikeShowcase({ character, currentUserId, isLikedInitially }: ShowcaseProps) {
  const isOwner = character.meta.userId === currentUserId;

  return (
    <main className="min-h-screen w-full bg-[#0a2a2f] text-white overflow-hidden relative">
      {/* HUD top bar */}
      <div className="relative z-20 flex items-center justify-between px-6 pt-4">
        <Link href="/">
          <button className="rounded-full bg-[#172326]/80 hover:bg-[#223537] border border-white/20 p-2 backdrop-blur-md shadow">
            <ArrowLeft className="h-5 w-5"/>
          </button>
        </Link>
      </div>

      <section className="relative z-10 grid grid-cols-1 lg:grid-cols-[400px_minmax(0,1fr)_280px] gap-6 px-6 pb-6 pt-2">
        {/* LEFT PANEL */}
        <div className="bg-[#142022]/90 rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-white/10">
            <p className="text-[10px] uppercase tracking-widest text-emerald-200/80">{character.core.archetype || "Adventurer"}</p>
            <div className="mt-1 flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-[#1e2b2d] border border-emerald-300/30 flex items-center justify-center">
                 <User className="h-8 w-8 text-emerald-300/70" />
              </div>
              <div>
                <h2 className="text-lg font-bold">{character.core.name}</h2>
                <p className="text-xs text-emerald-300">Lv. {character.rpg.level}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="px-3 py-1 rounded-full bg-emerald-400/25 text-emerald-200 border border-emerald-400/40 font-medium shadow-inner">Biography</span>
            </div>
          </div>
          <div className="p-5 space-y-4 overflow-y-auto max-h-[56vh] custom-scroll">
            <p className="text-sm text-white/85 leading-relaxed">
              {character.core.biography}
            </p>
             <div className="rounded-md bg-slate-500/15 border border-slate-400/30 p-3 text-slate-200 text-xs shadow-inner space-y-1">
                <p><b>Alignment:</b> {character.core.alignment}</p>
                <p><b>Equipment:</b> {character.core.equipment?.join(', ') || 'None'}</p>
                <p><b>Weaknesses:</b> {character.core.weaknesses || 'None'}</p>
             </div>
          </div>
          <div className="mt-auto px-5 py-3 border-t border-white/10 flex items-center gap-2 text-xs text-white/70">
            {character.core.tags.slice(0, 3).map(tag => <Badge key={tag}>{tag}</Badge>)}
            {character.core.tags.length > 3 && <Badge>...</Badge>}
          </div>
        </div>

        {/* CENTER PANEL */}
        <div className="relative rounded-2xl border border-white/10 bg-[#142022]/90 backdrop-blur overflow-hidden shadow-2xl min-h-[65vh]">
          <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 border border-white/10 backdrop-blur">
            <span className="text-sm font-semibold">Creator: @{character.meta.userName}</span>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Image 
                src={character.visuals.showcaseImageUrl || character.visuals.imageUrl} 
                alt={character.core.name} 
                width={1024}
                height={1024}
                className="max-h-[80vh] object-contain drop-shadow-[0_25px_50px_rgba(0,0,0,0.8)]" 
                priority
            />
          </div>
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-3 p-4 bg-gradient-to-t from-black/60 to-transparent">
             {isOwner ? (
                <ActionButton asChild href={`/characters/${character.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4"/> Edit
                </ActionButton>
            ) : (
                <ActionButton variant="ghost">Share</ActionButton>
            )}
            <LikeButton 
                characterId={character.id}
                initialLikes={character.meta.likes}
                isLikedInitially={isLikedInitially}
                currentUserId={currentUserId}
             />
          </div>
        </div>

        {/* RIGHT PANEL */}
        <aside className="bg-[#142022]/90 rounded-2xl border border-white/10 shadow-2xl p-4 flex flex-col">
          <h3 className="text-sm font-semibold text-white/80 mb-3">Skills</h3>
          {character.rpg.skills.length > 0 ? (
            character.rpg.skills.map(skill => (
                <TalentItem key={skill.id} level={skill.power} title={skill.name} icon={skillIcons[skill.type]} type={skill.type} />
            ))
          ) : (
             <div className="text-center text-white/50 text-sm mt-8">
                This character has no defined skills.
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
