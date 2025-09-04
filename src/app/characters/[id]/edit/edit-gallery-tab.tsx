
'use client';

import type { Character } from '@/types/character';
import { EditGalleryTab as EditGalleryTabClient } from '@/components/character/edit-gallery-tab';


export function EditGalleryTab({ character }: { character: Character }) {
    // This component now acts as a simple server-to-client wrapper.
    // All logic is contained within the client component.
    return <EditGalleryTabClient character={character} />
}
