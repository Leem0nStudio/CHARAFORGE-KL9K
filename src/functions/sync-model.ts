
/**
 * @fileoverview Cloud Function to sync AI models from external sources to GCS.
 */

import { logger, https } from 'firebase-functions/v2';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import axios from 'axios';
import { promisify } from 'util';
import { pipeline } from 'stream';

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();
const streamPipeline = promisify(pipeline);

/**
 * Fetches the direct download URL for a model version from the Civitai API.
 */
async function getCivitaiDownloadUrl(versionId: string): Promise<string> {
  const apiKey = process.env.CIVITAI_API_KEY;
  if (!apiKey) {
    throw new Error('CIVITAI_API_KEY environment variable not set.');
  }
  const url = `https://civitai.com/api/v1/model-versions/${versionId}`;
  const response = await axios.get(url, { headers: { 'Authorization': `Bearer ${apiKey}` } });
  const downloadUrl = response.data?.files?.[0]?.downloadUrl;
  if (!downloadUrl) {
    throw new Error(`Could not find download URL for Civitai version ID ${versionId}.`);
  }
  return `${downloadUrl}?token=${apiKey}`;
}

/**
 * HTTP-triggered function to sync a single AI model.
 * Expects a POST request with a JSON body: { modelId: string }
 */
export const syncModelWorker = https.onRequest(
  { timeoutSeconds: 900, memory: '1GiB', region: 'us-central1' },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const { modelId } = req.body;
    if (!modelId) {
      res.status(400).send('Missing modelId in request body.');
      return;
    }

    const modelRef = db.collection('ai_models').doc(modelId);

    try {
      logger.info(`Starting sync for model: ${modelId}`);
      await modelRef.update({ syncStatus: 'syncing', syncError: null });

      const modelDoc = await modelRef.get();
      const modelData = modelDoc.data();

      if (!modelData || !modelData.civitaiModelId || !modelData.versionId) {
        throw new Error('Model document is missing required Civitai fields.');
      }

      const downloadUrl = await getCivitaiDownloadUrl(modelData.versionId);
      logger.info(`Found download URL: ${downloadUrl.split('?')[0]}`);

      const response = await axios.get(downloadUrl, { responseType: 'stream' });

      const bucket = getStorage().bucket(process.env.MODELS_STORAGE_BUCKET || undefined);
      const fileExtension = modelData.filename?.split('.').pop() || 'safetensors';
      const blobName = `models/${modelData.name.replace(/\s+/g, '_')}/${modelData.versionId}.${fileExtension}`;
      const blob = bucket.file(blobName);
      const blobStream = blob.createWriteStream({
        resumable: false,
        metadata: { contentType: 'application/octet-stream' },
      });

      logger.info(`Uploading to GCS at: ${blobName}`);
      await streamPipeline(response.data, blobStream);
      logger.info('Upload complete.');

      const gcsUri = `gs://${bucket.name}/${blobName}`;
      await modelRef.update({ syncStatus: 'synced', gcsUri: gcsUri });

      logger.info(`✅ Successfully synced model ${modelId}. URI: ${gcsUri}`);
      res.status(200).send({ success: true, gcsUri });

    } catch (error: any) {
      const errorMessage = error.message || 'An unknown error occurred.';
      logger.error(`🚨 Failed to sync model ${modelId}:`, errorMessage, { error });
      try {
        await modelRef.update({ syncStatus: 'error', syncError: errorMessage });
      } catch (dbError) {
        logger.error(`Failed to even update Firestore with error state for ${modelId}`, dbError);
      }
      res.status(500).send({ success: false, error: errorMessage });
    }
  }
);
