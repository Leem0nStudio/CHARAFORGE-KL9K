
'use server';

/**
 * Represents the structure for an AI model or LoRA stored in Firestore.
 * Metadata is sourced from Civitai, while the hf_id is used for execution.
 */
export interface AiModel {
  id: string; // Document ID
  name: string; // From Civitai
  type: 'model' | 'lora';
  hf_id: string; // Hugging Face or Gradio Space ID for execution
  
  // Civitai metadata
  civitaiModelId: string;
  versionId: string;
  coverImageUrl?: string;
  triggerWords?: string[];

  createdAt: Date;
}
