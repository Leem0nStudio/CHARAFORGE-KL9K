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

export interface DataPackSchemaField {
    id: string;
    label: string;
    type: 'select' | 'text' | 'textarea';
    optionsSource?: string; // Filename like "hair_styles.txt"
    placeholder?: string;
    required?: boolean;
}

export interface DataPackSchema {
    fields: DataPackSchemaField[];
    promptTemplate: string;
}

// Type for the form and server action
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
