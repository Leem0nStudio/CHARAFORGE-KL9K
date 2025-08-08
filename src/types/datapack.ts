

// This is the new, more flexible structure for schema that supports complex wizards.
export interface DataPackSchema {
    promptTemplate: string;
    slots: Slot[];
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
    schema: DataPackSchema | { [key: string]: string }; // Allow both old and new schema for transition
}

export interface UpsertDataPack {
    id?: string;
    name: string;
    author: string;
    description: string;
    type: 'free' | 'premium' | 'temporal';
    price: number;
    tags: string; // Comma-separated tags
    schema: { [key: string]: string }; // Admin still submits as YAML strings for simplicity.
}

// These types define the structure within the new DataPackSchema.
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
    options: Option[];
    defaultOption?: string;
    placeholder?: string;
}

    