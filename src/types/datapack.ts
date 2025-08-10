

export interface Exclusion {
    slotId: string;
    optionValues: string[];
}

export interface Option {
    label: string;
    value: string;
    exclusions?: Exclusion[];
}

export interface Slot {
    id: string;
    label: string;
    type?: 'text' | 'select';
    options?: Option[];
    defaultOption?: string;
    placeholder?: string;
}

// This is the new, definitive structure for a DataPack's schema.
export interface DataPackSchema {
    promptTemplate: string;
    slots: Slot[];
    tags?: string[];
}

export interface DataPack {
    id: string;
    name: string;
    author: string;
    description: string;
    coverImageUrl: string | null;
    type: 'free' | 'premium' | 'temporal';
    price: number;
    tags: string[];
    createdAt: Date;
    updatedAt?: Date | null;
    schema: DataPackSchema; // Standardized to the new, structured format.
}

export interface UpsertDataPack {
    id?: string;
    name: string;
    author: string;
    description: string;
    type: 'free' | 'premium' | 'temporal';
    price: number;
    tags: string[]; // Keep tags for passing to server action
    schema: DataPackSchema; // The schema is now a structured object, not a string.
}

    