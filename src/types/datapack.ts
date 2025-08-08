

// The schema is now a flexible container for YAML content.
// Each key represents a "file" (e.g., 'outfits', 'poses') and its value is the raw YAML string.
export type DataPackSchema = {
    [key: string]: string; // e.g., { "prompt_template": "...", "style": "...", "race": "..." }
};

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
    schema: DataPackSchema; // The schema is now the object containing YAML strings.
}

export interface UpsertDataPack {
    id?: string;
    name: string;
    author: string;
    description: string;
    type: 'free' | 'premium' | 'temporal';
    price: number;
    tags: string; // Comma-separated tags
    schema: DataPackSchema; // The full schema object with YAML strings is submitted.
}

// These types might be used internally by a YAML parser, but are no longer part of the core data model.
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
