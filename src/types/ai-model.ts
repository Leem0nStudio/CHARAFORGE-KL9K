
'use server';

/**
 * Represents the structure for an AI model or LoRA stored in Firestore.
 */
export interface AiModel {
  id: string; // Document ID
  name: string; // User-friendly name
  hf_id: string; // Hugging Face identifier (e.g., "stabilityai/stable-diffusion-xl-base-1.0")
  type: 'model' | 'lora';
  description?: string;
  coverImageUrl?: string;
  triggerWords?: string[];
  createdAt: Date;
}
