

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
    schemaPath?: string;
    coverImagePath?: string;
}

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
    options: Option[];
    defaultOption?: string;
    placeholder?: string;
}

export interface DataPackSchema {
    name: string;
    version: string;
    slots: Slot[];
    promptTemplate: string;
}

export interface UpsertDataPack {
    id?: string;
    name: string;
    author: string;
    description: string;
    type: 'free' | 'premium' | 'temporal';
    price: number;
    tags: string;
    schema: string;
}
