
'use client';

import { useState, useEffect, useCallback, useTransition, Suspense } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ScrollText, Users, Wand2, FileText, Plus, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import type { StoryCast } from '@/types/story';
import type { Character } from '@/types/character';
import { getUserCasts, createStoryCast, updateStoryCastCharacters, generateStory } from '@/app/actions/stories';
import { getCharacters } from '@/app/actions/character-read';

import { BackButton } from '@/components/back-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';


function CastsList({ 
    casts, 
    selectedCast, 
    onSelect, 
    onAddCast 
}: { 
    casts: StoryCast[], 
    selectedCast: StoryCast | null, 
    onSelect: (cast: StoryCast) => void,
    onAddCast: (cast: StoryCast) => void
}) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newCastName, setNewCastName] = useState('');
    const [newCastDesc, setNewCastDesc] = useState('');
    const [isCreating, startCreateTransition] = useTransition();
    const { toast } = useToast();

    const handleCreateCast = () => {
        if (!newCastName.trim()) {
            toast({ variant: 'destructive', title: 'Name required', description: 'Please enter a name for your new cast.' });
            return;
        }
        startCreateTransition(async () => {
            const result = await createStoryCast({ name: newCastName, description: newCastDesc });
            if (result.success && result.data) {
                toast({ title: 'Cast Created!', description: `Successfully created "${result.data.name}".`});
                onAddCast(result.data);
                setIsDialogOpen(false);
                setNewCastName('');
                setNewCastDesc('');
            } else {
                toast({ variant: 'destructive', title: 'Creation Failed', description: result.message });
            }
        });
    };

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Your Casts</span>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="icon" variant="outline"><Plus /></Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Cast</DialogTitle>
                                <DialogDescription>Give your new collection of characters a name and description.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <Input placeholder="Cast Name (e.g., The Fellowship)" value={newCastName} onChange={e => setNewCastName(e.target.value)} />
                                <Textarea placeholder="Description (optional)" value={newCastDesc} onChange={e => setNewCastDesc(e.target.value)} />
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreateCast} disabled={isCreating}>
                                    {isCreating && <Loader2 className="mr-2 animate-spin"/>}
                                    Create
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow p-2">
                <ScrollArea className="h-full max-h-[60vh] pr-4">
                    <div className="space-y-2">
                        {casts.map(cast => (
                            <button
                                key={cast.id}
                                onClick={() => onSelect(cast)}
                                className={cn(
                                    "w-full text-left p-3 rounded-lg border-2 transition-all duration-200",
                                    selectedCast?.id === cast.id
                                        ? "bg-primary/20 border-primary"
                                        : "bg-muted/50 border-transparent hover:border-muted-foreground/20"
                                )}
                            >
                                <p className="font-semibold">{cast.name}</p>
                                <p className="text-sm text-muted-foreground truncate">{cast.description}</p>
                            </button>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

function CharacterSelector({ 
    allCharacters, 
    currentCast, 
    onCastUpdated, 
    isOpen, 
    onClose 
}: { 
    allCharacters: Character[],
    currentCast: StoryCast,
    onCastUpdated: (updatedCast: StoryCast) => void,
    isOpen: boolean,
    onClose: () => void,
}) {
    const [selectedIds, setSelectedIds] = useState(new Set<string>());
    const [isSaving, startSaveTransition] = useTransition();
    const { toast } = useToast();

    useEffect(() => {
        if (isOpen) {
            setSelectedIds(new Set(currentCast.character_ids));
        }
    }, [currentCast, isOpen]);
    
    const handleSelect = (charId: string) => {
        setSelectedIds(prev => {
            const newIds = new Set(prev);
            if (newIds.has(charId)) {
                newIds.delete(charId);
            } else {
                newIds.add(charId);
            }
            return newIds;
        });
    };

    const handleSave = () => {
        startSaveTransition(async () => {
            const updatedIds = Array.from(selectedIds);
            const result = await updateStoryCastCharacters(currentCast.id, updatedIds);
            if (result.success) {
                toast({ title: "Cast Updated" });
                onCastUpdated({ ...currentCast, character_ids: updatedIds });
                onClose();
            } else {
                toast({ variant: 'destructive', title: 'Update Failed', description: result.message });
            }
        });
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl h-[90vh] md:h-auto flex flex-col">
                <DialogHeader>
                    <DialogTitle>Add Characters to "{currentCast.name}"</DialogTitle>
                    <DialogDescription>Select the characters you want to include in this cast.</DialogDescription>
                </DialogHeader>
                 <ScrollArea className="flex-grow -mx-6 px-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {allCharacters.map(char => {
                            const isSelected = selectedIds.has(char.id);
                            return (
                                <div
                                    key={char.id}
                                    onClick={() => handleSelect(char.id)}
                                    className="flex items-center space-x-3 border p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                                >
                                    <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => handleSelect(char.id)}
                                        id={`char-select-${char.id}`}
                                    />
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={char.visuals.imageUrl} alt={char.core.name}/>
                                        <AvatarFallback>{char.core.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <label htmlFor={`char-select-${char.id}`} className="font-semibold cursor-pointer">{char.core.name}</label>
                                        <p className="text-xs text-muted-foreground line-clamp-1">{char.core.archetype || char.generation.originalPrompt}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </ScrollArea>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 animate-spin" />}
                        Save Cast
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function LoreForgeGenerator({ 
    cast, 
    characters,
    onCastUpdated,
}: { 
    cast: StoryCast, 
    characters: Character[],
    onCastUpdated: (updatedCast: StoryCast) => void;
}) {
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [generatedStory, setGeneratedStory] = useState<{title: string; content: string} | null>(null);
    const [isProcessing, startProcessingTransition] = useTransition();
    const { toast } = useToast();

    const castCharacters = characters.filter(c => cast.character_ids.includes(c.id));

    const handleGenerateStory = () => {
        if (!prompt.trim()) {
            toast({ variant: 'destructive', title: 'Prompt is empty', description: 'Please provide a theme or idea for the story.'});
            return;
        }
        if (cast.character_ids.length === 0) {
             toast({ variant: 'destructive', title: 'Cast is empty', description: 'Add characters to your cast before generating a story.'});
            return;
        }

        startProcessingTransition(async () => {
            const result = await generateStory(cast.id, prompt);
            if (result.success && result.data) {
                setGeneratedStory(result.data);
                toast({ title: 'Story Generated!', description: 'Your new story is ready to read.' });
            } else {
                toast({ variant: 'destructive', title: 'Generation Failed', description: result.message });
            }
        })
    }
    
    const handleRemoveCharacterFromCast = (characterId: string) => {
        if (!cast) return;
        startProcessingTransition(async () => {
            const newCharacterIds = cast.character_ids.filter(id => id !== characterId);
            const result = await updateStoryCastCharacters(cast.id, newCharacterIds);
            if(result.success) {
                onCastUpdated({ ...cast, character_ids: newCharacterIds });
                toast({title: "Character Removed"});
            } else {
                toast({ variant: 'destructive', title: 'Update Failed', description: result.message });
            }
        });
    };

    return (
        <Card className="h-full flex flex-col">
            <CharacterSelector
                isOpen={isSelectorOpen}
                onClose={() => setIsSelectorOpen(false)}
                allCharacters={characters}
                currentCast={cast}
                onCastUpdated={onCastUpdated}
            />
            <CardHeader>
                <CardTitle>{cast.name}</CardTitle>
                <CardDescription>{cast.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-6">
                <div>
                    <h3 className="text-lg font-semibold flex items-center justify-between mb-2">
                        <span>The Cast ({cast.character_ids.length})</span>
                        <Button variant="outline" size="sm" onClick={() => setIsSelectorOpen(true)}>
                            <Plus className="mr-2"/> Add/Remove
                        </Button>
                    </h3>
                    <div className="p-2 border rounded-lg min-h-[100px]">
                        {castCharacters.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {castCharacters.map(char => (
                                    <div key={char.id} className="relative group">
                                         <Avatar className="h-20 w-20 mx-auto">
                                            <AvatarImage src={char.visuals.imageUrl} alt={char.core.name}/>
                                            <AvatarFallback>{char.core.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <p className="text-center text-sm font-medium mt-1 truncate">{char.core.name}</p>
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleRemoveCharacterFromCast(char.id)}
                                            disabled={isProcessing}
                                        >
                                            <X className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground p-4">
                                <p>This cast is empty. Add some characters to begin.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-2">Lore Prompt</h3>
                    <Textarea 
                        placeholder="e.g., The cast discovers a mysterious artifact in an ancient ruin..."
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        className="min-h-[100px]"
                    />
                </div>
            </CardContent>
            <CardFooter className="flex-col items-stretch gap-4">
                 <Button onClick={handleGenerateStory} disabled={isProcessing} size="lg" className="w-full font-headline text-lg">
                    {isProcessing ? <Loader2 className="mr-2 animate-spin"/> : <Wand2 className="mr-2"/>}
                    Generate Lore
                </Button>
                 {generatedStory && (
                    <motion.div initial={{ opacity: 0, y:10 }} animate={{ opacity: 1, y: 0 }} className="border p-4 rounded-lg bg-background">
                        <h3 className="text-xl font-bold font-headline mb-2">{generatedStory.title}</h3>
                        <ScrollArea className="h-64 pr-4">
                             <p className="text-muted-foreground whitespace-pre-wrap">{generatedStory.content}</p>
                        </ScrollArea>
                    </motion.div>
                )}
            </CardFooter>
        </Card>
    )
}

function LoreForgeContent() {
    const { authUser, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [casts, setCasts] = useState<StoryCast[]>([]);
    const [characters, setCharacters] = useState<Character[]>([]);
    const [selectedCast, setSelectedCast] = useState<StoryCast | null>(null);

    const fetchData = useCallback(async () => {
        if (!authUser) return;
        setIsLoading(true);
        try {
            const [userCasts, userCharacters] = await Promise.all([
                getUserCasts(),
                getCharacters(authUser.id),
            ]);

            setCasts(userCasts);
            setCharacters(userCharacters);

            if (userCasts.length > 0) {
                // If there's a selected cast, find its latest version in the newly fetched data
                if (selectedCast) {
                    const updatedSelectedCast = userCasts.find(c => c.id === selectedCast.id);
                    setSelectedCast(updatedSelectedCast || userCasts[0]);
                } else {
                    setSelectedCast(userCasts[0]);
                }
            } else {
                setSelectedCast(null);
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Failed to load data', description: 'Could not fetch your casts and characters.' });
        } finally {
            setIsLoading(false);
        }
    }, [toast, selectedCast]);

    useEffect(() => {
        if (!authLoading && !authUser) {
            router.push('/login');
        } else if (authUser) {
            fetchData();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authLoading, authUser, router]);
    
    const handleAddCast = (newCast: StoryCast) => {
        const newCasts = [newCast, ...casts];
        setCasts(newCasts);
        setSelectedCast(newCast);
    };

    const handleUpdateCast = (updatedCast: StoryCast) => {
        const newCasts = casts.map(c => c.id === updatedCast.id ? updatedCast : c);
        setCasts(newCasts);
        setSelectedCast(updatedCast);
    }
    
    if (authLoading || isLoading) {
         return (
            <div className="flex items-center justify-center h-screen w-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container py-8">
            <BackButton title="Lore Forge" description="Create epic tales starring your own characters." />
            <div className="grid lg:grid-cols-3 gap-8 items-start max-w-7xl mx-auto mt-8">
                <div className="lg:col-span-1">
                    <CastsList
                        casts={casts}
                        selectedCast={selectedCast}
                        onSelect={setSelectedCast}
                        onAddCast={handleAddCast}
                    />
                </div>
                <div className="lg:col-span-2">
                    <AnimatePresence mode="wait">
                        {selectedCast ? (
                             <motion.div
                                key={selectedCast.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <LoreForgeGenerator 
                                    cast={selectedCast} 
                                    characters={characters}
                                    onCastUpdated={handleUpdateCast}
                                />
                            </motion.div>
                        ) : (
                            <Card className="h-full flex items-center justify-center min-h-[600px]">
                                <div className="text-center text-muted-foreground">
                                    <Users className="h-12 w-12 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold">No Cast Selected</h3>
                                    <p>Create or select a cast to start forging your lore.</p>
                                </div>
                            </Card>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}

export default function LoreForgePage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-screen w-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <LoreForgeContent />
        </Suspense>
    );
}
