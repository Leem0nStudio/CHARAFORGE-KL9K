/**
 * Configuration file for Google Cloud Vertex AI Model Garden
 * This file allows you to easily configure and manage different Vertex AI endpoints
 * for Stable Diffusion models like Illustrious.
 */

export interface VertexAIModelConfig {
  id: string;
  name: string;
  endpointId: string;
  description: string;
  supportedFeatures: string[];
  defaultSettings: {
    guidanceScale: number;
    numInferenceSteps: number;
    sampleCount: number;
  };
  location: string;
  projectId?: string;
}

// Default Vertex AI Stable Diffusion Illustrious configuration
export const STABLE_DIFFUSION_ILLUSTRIOUS: VertexAIModelConfig = {
  id: 'stable-diffusion-illustrious',
  name: 'Stable Diffusion Illustrious',
  endpointId: '1497098330914684928', // Your actual endpoint ID
  description: 'High-quality Stable Diffusion Illustrious model with enhanced artistic capabilities',
  supportedFeatures: ['text-to-image', 'lora-support', 'high-resolution'],
  defaultSettings: {
    guidanceScale: 7.5,
    numInferenceSteps: 20,
    sampleCount: 1,
  },
  location: 'us-central1',
};

// Example for other Vertex AI models
export const STABLE_DIFFUSION_XL: VertexAIModelConfig = {
  id: 'stable-diffusion-xl-1-0',
  name: 'Stable Diffusion XL 1.0',
  endpointId: '1234567890123456789', // Replace with actual endpoint ID
  description: 'Stable Diffusion XL 1.0 for high-resolution image generation',
  supportedFeatures: ['text-to-image', 'lora-support', 'xl-resolution'],
  defaultSettings: {
    guidanceScale: 7.5,
    numInferenceSteps: 25,
    sampleCount: 1,
  },
  location: 'us-central1',
};

// Add more Vertex AI models here as needed
export const VERTEX_AI_MODELS: VertexAIModelConfig[] = [
  STABLE_DIFFUSION_ILLUSTRIOUS,
  STABLE_DIFFUSION_XL,
  // Example for another model:
  // {
  //   id: 'another-vertex-model',
  //   name: 'Another Vertex AI Model',
  //   endpointId: 'your-endpoint-id',
  //   description: 'Description of another Vertex AI model',
  //   supportedFeatures: ['feature1', 'feature2'],
  //   defaultSettings: {
  //     guidanceScale: 8.0,
  //     numInferenceSteps: 30,
  //     sampleCount: 1,
  //   },
  //   location: 'us-central1',
  // },
];

/**
 * Get a Vertex AI model configuration by ID
 */
export function getVertexAIModel(id: string): VertexAIModelConfig | undefined {
  return VERTEX_AI_MODELS.find(model => model.id === id);
}

/**
 * Get all Vertex AI model configurations
 */
export function getAllVertexAIModels(): VertexAIModelConfig[] {
  return VERTEX_AI_MODELS;
}

/**
 * Get Vertex AI model configuration by endpoint ID
 */
export function getVertexAIModelByEndpointId(endpointId: string): VertexAIModelConfig | undefined {
  return VERTEX_AI_MODELS.find(model => model.endpointId === endpointId);
}

/**
 * Validate if a Vertex AI endpoint is accessible
 */
export async function validateVertexAIEndpoint(endpointId: string, projectId?: string, location: string = 'us-central1'): Promise<boolean> {
  try {
    // This would require the Google Auth library and proper credentials
    // For now, we'll just validate the format
    if (!endpointId || endpointId.length < 10) {
      return false;
    }
    
    // You could add more validation here, such as:
    // - Checking if the endpoint ID format is valid
    // - Verifying the project ID exists
    // - Testing connectivity to the endpoint
    
    return true;
  } catch (error) {
    console.error('Vertex AI endpoint validation failed:', error);
    return false;
  }
}

/**
 * Get the full endpoint URL for a Vertex AI model
 */
export function getVertexAIEndpointUrl(model: VertexAIModelConfig, projectId: string): string {
  return `https://${model.location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${model.location}/endpoints/${model.endpointId}:predict`;
}

/**
 * Get default location for Vertex AI endpoints
 */
export function getDefaultVertexAILocation(): string {
  return 'us-central1';
}

/**
 * Get supported locations for Vertex AI
 */
export function getSupportedVertexAILocations(): string[] {
  return [
    'us-central1',
    'us-east1',
    'us-west1',
    'europe-west1',
    'asia-northeast1',
  ];
}