/**
 * Configuration file for custom Stable Diffusion endpoints
 * This file allows you to easily configure and manage different custom endpoints
 * for Stable Diffusion models like Illustrious.
 */

export interface CustomEndpointConfig {
  id: string;
  name: string;
  url: string;
  apiKey?: string;
  description: string;
  supportedModels: string[];
  defaultSettings: {
    numInferenceSteps: number;
    guidanceScale: number;
    negativePrompt: string;
  };
}

// Default Stable Diffusion Illustrious endpoint configuration
export const STABLE_DIFFUSION_ILLUSTRIOUS: CustomEndpointConfig = {
  id: 'stable-diffusion-illustrious',
  name: 'Stable Diffusion Illustrious',
  url: 'http://localhost:7860/api/predict', // Change this to your actual endpoint
  description: 'Custom Stable Diffusion Illustrious model endpoint',
  supportedModels: ['stable-diffusion-illustrious'],
  defaultSettings: {
    numInferenceSteps: 20,
    guidanceScale: 7.5,
    negativePrompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy',
  },
};

// Add more custom endpoints here as needed
export const CUSTOM_ENDPOINTS: CustomEndpointConfig[] = [
  STABLE_DIFFUSION_ILLUSTRIOUS,
  // Example for another endpoint:
  // {
  //   id: 'another-model',
  //   name: 'Another Custom Model',
  //   url: 'http://your-server:port/api/predict',
  //   description: 'Description of another custom model',
  //   supportedModels: ['model-name'],
  //   defaultSettings: {
  //     numInferenceSteps: 25,
  //     guidanceScale: 8.0,
  //     negativePrompt: 'blurry, low quality',
  //   },
  // },
];

/**
 * Get a custom endpoint configuration by ID
 */
export function getCustomEndpoint(id: string): CustomEndpointConfig | undefined {
  return CUSTOM_ENDPOINTS.find(endpoint => endpoint.id === id);
}

/**
 * Get all custom endpoint configurations
 */
export function getAllCustomEndpoints(): CustomEndpointConfig[] {
  return CUSTOM_ENDPOINTS;
}

/**
 * Validate if a custom endpoint URL is accessible
 */
export async function validateCustomEndpoint(url: string, apiKey?: string): Promise<boolean> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prompt: 'test',
        num_inference_steps: 1,
        guidance_scale: 7.5,
        width: 512,
        height: 512,
      }),
    });

    // We consider it valid if we get any response (even an error response)
    // as it means the endpoint is reachable
    return response.status !== 0;
  } catch (error) {
    console.error('Custom endpoint validation failed:', error);
    return false;
  }
}