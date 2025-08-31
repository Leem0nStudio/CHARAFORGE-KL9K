
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { DataPackCard } from './datapack-card';
import type { DataPack } from '@/types/datapack';
import { EmblaCarousel } from '../ui/carousel';

// Wrapper component to make DataPackCard compatible with EmblaCarousel
const DataPackCardWrapper = ({ pack }: { pack?: DataPack }) => {
    if (!pack) return null;
    return <DataPackCard pack={pack} />;
};

export function DataPackStore({ dataPacks }: { dataPacks: DataPack[] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredPacks, setFilteredPacks] = useState(dataPacks);

    useEffect(() => {
        const results = dataPacks.filter(pack =>
            pack.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pack.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setFilteredPacks(results);
    }, [searchTerm, dataPacks]);

    const featuredPacks = dataPacks.filter(p => p.type === 'premium').slice(0, 5);
    const regularPacks = filteredPacks.filter(p => !featuredPacks.some(fp => fp.id === p.id));

    return (
        <div className="container py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-12"
            >
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight font-headline bg-clip-text text-transparent bg-gradient-to-b from-primary to-primary/70">
                    DataPack Store
                </h1>
                <p className="max-w-2xl mx-auto mt-4 text-muted-foreground sm:text-xl">
                    Your one-stop shop for creative assets. Discover premium and community-made packs to fuel your imagination.
                </p>
                 <div className="relative max-w-lg mx-auto mt-8">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search packs by name or tag..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </motion.div>
            
            {searchTerm === '' && featuredPacks.length > 0 && (
                 <section className="mb-16">
                    <h2 className="text-2xl font-bold font-headline mb-6">Featured Packs</h2>
                    <EmblaCarousel slides={featuredPacks} CardComponent={DataPackCardWrapper} />
                </section>
            )}

            <section>
                 <h2 className="text-2xl font-bold font-headline mb-6">{searchTerm ? 'Search Results' : 'All DataPacks'}</h2>
                 {regularPacks.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {regularPacks.map(pack => (
                            <DataPackCard key={pack.id} pack={pack} />
                        ))}
                    </div>
                 ) : (
                    <div className="text-center text-muted-foreground py-16">
                        <p>No DataPacks found matching your search.</p>
                    </div>
                 )}
            </section>
        </div>
    );
}
