
export interface DataPack {
    id: string;
    name: string;
    author: string;
    description: string;
    coverImageUrl: string | null;
    schemaUrl: string;
    type: 'free' | 'premium' | 'temporal';
    price: number;
    tags: string[];
    createdAt: Date;
}

// Corresponds to PromptBuilder v2 structure

export interface Exclusion {
    slotId: string;       // The slot to affect e.g. "neck"
    optionValues: string[]; // The option values to disable e.g. ["cape", "high_collar"]
}

export interface Option {
    label: string;      // "Demonic Wings"
    value: string;      // "demonic_wings"
    exclusions?: Exclusion[]; // Rules to apply if this option is selected
}

export interface Slot {
    id: string;         // e.g. "back"
    label: string;      // "Back Item"
    options: Option[];
    defaultOption?: string;
    placeholder?: string;
}

export interface DataPackSchema {
    name: string; // e.g. "Dark Fantasy Character Builder"
    version: string;
    slots: Slot[];
    promptTemplate: string;
}


// Type for the admin form and server action
export interface UpsertDataPack {
    id?: string; // Present when updating
    name: string;
    author: string;
    description: string;
    type: 'free' | 'premium' | 'temporal';
    price: number;
    tags: string; // Comma-separated string from the form
    schema: string; // Raw JSON string of the schema
    // {[optionsSource]: content} e.g. {"hair_styles.txt": "mohawk\nponytail"}
    options: Record<string, string>; 
}
