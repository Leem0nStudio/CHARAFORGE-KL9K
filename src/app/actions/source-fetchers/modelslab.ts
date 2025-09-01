
'use server';

/**
 * Fetches detailed model information from the ModelsLab API using a model ID or slug.
 * This function requires a system-level API key to be set in the environment variables.
 * @param modelIdOrSlug The numerical ID or the text-based slug of the model.
 * @returns A promise that resolves to the JSON response from the API.
 * @throws An error if the API key is not configured or if the request fails.
 */
export async function getModelsLabModelInfo(modelIdOrSlug: string): Promise<any> {
    const apiKey = process.env.MODELSLAB_API_KEY;
    if (!apiKey) {
        throw new Error("ModelsLab API key is not configured on the server. Please add MODELSLAB_API_KEY to your .env file.");
    }
    const url = `https://modelslab.com/api/v6/model/${modelIdOrSlug}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey, // The key must be sent as a header for this endpoint.
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            let errorBody = `Status: ${response.status}`;
            try {
                const errorJson = await response.json();
                errorBody += ` ${errorJson.message || errorJson.detail || JSON.stringify(errorJson)}`;
            } catch(e) {
                 errorBody += ` ${response.statusText}`;
            }
            throw new Error(`Could not find a model on ModelsLab matching the identifier: "${modelIdOrSlug}". ${errorBody}`);
        }
        return response.json();

    } catch (error) {
        console.error(`ModelsLab API Error for ID/Slug "${modelIdOrSlug}":`, error);
        throw error;
    }
}

  