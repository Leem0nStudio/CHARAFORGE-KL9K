
'use server';

/**
 * @fileOverview An AI agent for converting text to audible speech.
 * This flow takes a string of text, sends it to a Google TTS model,
 * and returns the audio as a Base64-encoded WAV data URI.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { GenerateSpeechInputSchema, GenerateSpeechOutputSchema, type GenerateSpeechInput, type GenerateSpeechOutput } from './types';
import wav from 'wav';

/**
 * Converts raw PCM audio data from the AI model into a standard WAV format,
 * then Base64-encodes it.
 * @param {Buffer} pcmData The raw PCM audio buffer.
 * @returns {Promise<string>} A promise that resolves to the Base64-encoded WAV string.
 */
async function toWav(pcmData: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
        const writer = new wav.Writer({
            channels: 1,
            sampleRate: 24000,
            bitDepth: 16,
        });

        const buffers: Buffer[] = [];
        writer.on('data', (chunk) => buffers.push(chunk));
        writer.on('end', () => resolve(Buffer.concat(buffers).toString('base64')));
        writer.on('error', reject);

        writer.write(pcmData);
        writer.end();
    });
}

const generateSpeechFlow = ai.defineFlow(
    {
        name: 'generateSpeechFlow',
        inputSchema: GenerateSpeechInputSchema,
        outputSchema: GenerateSpeechOutputSchema,
    },
    async ({ textToNarrate }) => {
        const { media } = await ai.generate({
            model: 'googleai/gemini-2.5-flash-preview-tts',
            prompt: textToNarrate,
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Algenib' }, // A pleasant, standard voice
                    },
                },
            },
        });

        if (!media?.url) {
            throw new Error('AI model did not return any audio media.');
        }

        // The returned URL is a data URI with Base64-encoded PCM data.
        const audioBuffer = Buffer.from(
            media.url.substring(media.url.indexOf(',') + 1),
            'base64'
        );
        
        const wavData = await toWav(audioBuffer);

        return {
            audioDataUri: `data:audio/wav;base64,${wavData}`,
        };
    }
);


/**
 * Public-facing function to trigger the TTS flow.
 * @param {GenerateSpeechInput} input The text to be converted to speech.
 * @returns {Promise<GenerateSpeechOutput>} The result of the TTS generation.
 */
export async function generateSpeech(input: GenerateSpeechInput): Promise<GenerateSpeechOutput> {
  return generateSpeechFlow(input);
}
