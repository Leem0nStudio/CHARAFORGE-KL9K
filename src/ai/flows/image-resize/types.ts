
import {z} from 'genkit';

export const ResizeImageInputSchema = z.object({
  imageUrl: z
    .string()
    .describe(
      "The original image as a data URI, which must include a MIME type and Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ResizeImageInput = z.infer<typeof ResizeImageInputSchema>;

export const ResizeImageOutputSchema = z.object({
  resizedImageUrl: z
    .string()
    .describe('The resized 512x512 image as a data URI.'),
});
export type ResizeImageOutput = z.infer<typeof ResizeImageOutputSchema>;
