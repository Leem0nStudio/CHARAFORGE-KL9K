

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { Character } from '@/types/character';
import { ArrowLeft, Edit, Share2, Dna, Swords as SwordsIcon, Shield, BrainCircuit } from 'lucide-react';
import { StatItem } from './stat-item';
import { StarRating } from './star-rating';
import { motion } from 'framer-motion';

interface ShowcaseViewerProps {
    character: Character;
    currentUserId: string | null;
}

function SkillDisplay({ skill }: { skill: Character['rpg']['skills'][0]}) {
    const iconMap = {
        attack: <SwordsIcon className="text-destructive w-4 h-4" />,
        defense: <Shield className="text-blue-500 w-4 h-4" />,
        utility: <BrainCircuit className="text-green-500 w-4 h-4" />,
    }

    return (
        <div className="text-sm">
            <div className="flex justify-between items-start gap-2">
                <h4 className="font-semibold text-card-foreground">{skill.name}</h4>
                 <div className="flex items-center gap-1.5 shrink-0">
                     <span className="text-xs font-bold text-primary">{skill.power}</span>
                     {iconMap[skill.type]}
                 </div>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{skill.description}</p>
        </div>
    )
}


export function ShowcaseViewer({ character, currentUserId }: ShowcaseViewerProps) {
    const isOwner = character.meta.userId === currentUserId;
    const showcaseImage = character.visuals.showcaseImageUrl || character.visuals.imageUrl;
    const backgroundImage = character.visuals.imageUrl;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <div className="relative min-h-screen w-full overflow-hidden">
            {/* Background Image */}
            <Image
                src={backgroundImage}
                alt={`Background for ${character.core.name}`}
                fill
                className="object-cover object-center scale-125"
                quality={50}
            />
            <div className="absolute inset-0 bg-background/70 backdrop-blur-xl" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent md:bg-gradient-to-r" />
            
            {/* Back Button */}
            <div className="absolute top-4 left-4 z-20">
                <Button asChild variant="ghost" size="icon">
                    <Link href="/"><ArrowLeft/></Link>
                </Button>
            </div>

            {/* Main Content - Mobile First (Flex Column) then Grid for larger screens */}
            <motion.div 
                className="relative z-10 flex flex-col md:grid md:grid-cols-2 lg:grid-cols-3 gap-8 min-h-screen items-center container py-16 md:py-0"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                {/* Character Image */}
                <motion.div 
                    className="lg:col-span-2 flex items-center justify-center w-full"
                    variants={itemVariants}
                >
                    <Image
                        src={showcaseImage}
                        alt={character.core.name}
                        width={1024}
                        height={1024}
                        className="object-contain max-h-[60vh] md:max-h-[80vh] w-auto drop-shadow-[0_5px_15px_rgba(0,0,0,0.3)]"
                        priority
                    />
                </motion.div>

                {/* Info Panel */}
                <motion.div className="w-full" variants={itemVariants}>
                     <Card className="bg-card/80 backdrop-blur-md">
                        <ScrollArea className="h-full max-h-[85vh]">
                        <CardContent className="p-6 space-y-4">
                            <div>
                                <h1 className="text-3xl font-headline tracking-wider">{character.core.name}</h1>
                                <StarRating rating={character.core.rarity || 3} />
                            </div>

                            <Separator />

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <StatItem label="Archetype" value={character.core.archetype || 'N/A'} />
                                <StatItem label="Alignment" value={character.core.alignment} />
                                <StatItem label="Text Engine" value={character.generation.textEngine || 'N/A'} />
                                <StatItem label="Image Engine" value={character.generation.imageEngine || 'N/A'} />
                            </div>
                            
                             <div>
                                <h3 className="font-semibold text-muted-foreground mb-2">Lore</h3>
                                <ScrollArea className="h-40 md:h-48 pr-4">
                                    <p className="text-sm text-card-foreground/90 whitespace-pre-wrap">{character.core.biography}</p>
                                </ScrollArea>
                            </div>
                            
                            {character.rpg.isPlayable && (
                                <>
                                 <Separator />
                                 <div className="space-y-4">
                                     <h3 className="font-semibold text-muted-foreground flex items-center gap-2"><Dna className="w-4 h-4"/> Base Stats</h3>
                                      <div className="grid grid-cols-6 gap-2 text-center">
                                        <div className="flex flex-col items-center p-1 bg-background/50 rounded-md"><span className="text-xs text-muted-foreground">STR</span><b className="text-primary">{character.rpg.stats.strength}</b></div>
                                        <div className="flex flex-col items-center p-1 bg-background/50 rounded-md"><span className="text-xs text-muted-foreground">DEX</span><b className="text-primary">{character.rpg.stats.dexterity}</b></div>
                                        <div className="flex flex-col items-center p-1 bg-background/50 rounded-md"><span className="text-xs text-muted-foreground">CON</span><b className="text-primary">{character.rpg.stats.constitution}</b></div>
                                        <div className="flex flex-col items-center p-1 bg-background/50 rounded-md"><span className="text-xs text-muted-foreground">INT</span><b className="text-primary">{character.rpg.stats.intelligence}</b></div>
                                        <div className="flex flex-col items-center p-1 bg-background/50 rounded-md"><span className="text-xs text-muted-foreground">WIS</span><b className="text-primary">{character.rpg.stats.wisdom}</b></div>
                                        <div className="flex flex-col items-center p-1 bg-background/50 rounded-md"><span className="text-xs text-muted-foreground">CHA</span><b className="text-primary">{character.rpg.stats.charisma}</b></div>
                                    </div>
                                 </div>
                                  <div className="space-y-4">
                                     <h3 className="font-semibold text-muted-foreground flex items-center gap-2"><SwordsIcon className="w-4 h-4"/> Skills</h3>
                                      <div className="space-y-3">
                                        {character.rpg.skills.map((skill) => <SkillDisplay key={skill.id} skill={skill} />)}
                                      </div>
                                 </div>
                                </>
                            )}


                             <div className="flex gap-2 pt-4">
                                <Button className="flex-1" variant="secondary"><Share2 className="mr-2"/>Share</Button>
                                {isOwner && (
                                    <Button asChild className="flex-1">
                                        <Link href={`/characters/${character.id}/edit`}><Edit className="mr-2"/> Edit in Workshop</Link>
                                    </Button>
                                )}
                            </div>

                        </CardContent>
                        </ScrollArea>
                    </Card>
                </motion.div>
            </motion.div>
        </div>
    );
}
