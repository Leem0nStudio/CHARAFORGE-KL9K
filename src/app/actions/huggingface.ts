'use server';

/**
 * @fileOverview Server action to search for models on the Hugging Face Hub.
 * This is intended to be used as a tool for an AI agent.
 */

// A simple type for the model information we care about from the HF API.
type HfApiModel = {
    id: string;
    pipeline_tag?: string;
    // Add other fields here if needed in the future
};

/**
 * Searches the Hugging Face model hub.
 * @param query The search term.
 * @returns A promise that resolves to an array of model information.
 */
export async function searchHuggingFaceModels(query: string): Promise<{ id: string; pipeline_tag: string }[]> {
    if (!query) return [];

    const url = `https://huggingface.co/api/models?search=${encodeURIComponent(query)}&limit=10&filter=text-to-image`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
            },
        });
        
        if (!response.ok) {
            throw new Error(`Hugging Face API request failed with status ${response.status}`);
        }
        
        const models: HfApiModel[] = await response.json();
        
        // Return only the fields we've defined to keep the data clean
        return models.map(model => ({
            id: model.id,
            pipeline_tag: model.pipeline_tag || '',
        }));

    } catch (error) {
        console.error('Error searching Hugging Face models:', error);
        return [];
    }
}
