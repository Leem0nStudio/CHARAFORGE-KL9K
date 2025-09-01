
'use server';

/**
 * Fetches detailed model information from the Civitai API.
 * @param modelId The numerical ID of the model on Civitai.
 * @returns A promise that resolves to the JSON response from the API.
 * @throws An error if the API request fails.
 */
export async function getCivitaiModelInfo(modelId: string): Promise<any> {
    const url = `https://civitai.com/api/v1/models/${modelId}`;
    const response = await fetch(url, { 
        method: 'GET',
        cache: 'no-store' 
    });

    if (!response.ok) {
        let errorBody = `Status: ${response.status}`;
        try {
            const errorJson = await response.json();
            errorBody += ` ${errorJson.error || JSON.stringify(errorJson)}`;
        } catch(e) {
             errorBody += ` ${response.statusText}`;
        }
        throw new Error(`Failed to fetch model info from Civitai. ${errorBody}`);
    }
    return response.json();
}

  