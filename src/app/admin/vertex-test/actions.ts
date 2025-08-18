
'use server';

import { verifyAndGetUid } from '@/lib/auth/server';
import { GoogleAuth } from 'google-auth-library';

type VertexTestResponse = {
    success: boolean;
    message: string;
    imageUrl?: string | null;
};

export async function runVertexTest(prompt: string): Promise<VertexTestResponse> {
    await verifyAndGetUid(); // Ensure the user is an authenticated admin

    // --- Configuration: These values must match your Google Cloud setup ---
    let projectId: string | undefined;
    try {
        projectId = process.env.FIREBASE_PROJECT_ID || JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!).project_id;
    } catch(e) {
        console.error("Could not parse service account key to find Project ID", e);
    }
    
    const location = 'us-central1'; // As confirmed from your screenshot
    const endpointId = '1497098330914684928'; // Your specific endpoint ID
    // --- End Configuration ---
    
    if (!projectId) {
        return { success: false, message: "Could not determine Google Cloud Project ID from server environment." };
    }

    const endpointUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/endpoints/${endpointId}:predict`;

    // 2. Build the exact payload your model expects
    const payload = {
        instances: [
            { "text": prompt }
        ],
        parameters: {
            "width": 1024,
            "height": 1024,
            "sampleCount": 1
        }
    };

    try {
        // 3. Authenticate explicitly using the service account and make the API call
        const auth = new GoogleAuth({
            scopes: 'https://www.googleapis.com/auth/cloud-platform',
            // The library will automatically find the service account key from the environment
            // when running in a Google Cloud environment.
        });
        const client = await auth.getClient();
        
        const response = await client.request({
            url: endpointUrl,
            method: 'POST',
            data: payload,
        });

        // 4. Process the response
        const responseData = response.data as any;
        const prediction = responseData?.predictions?.[0];
        
        if (prediction?.bytesBase64Encoded) {
            const imageUrl = `data:image/png;base64,${prediction.bytesBase64Encoded}`;
            return {
                success: true,
                message: "Image generated successfully!",
                imageUrl: imageUrl,
            };
        } else {
            console.error("Vertex AI response did not contain an image:", JSON.stringify(responseData, null, 2));
            return {
                success: false,
                message: "The model endpoint responded, but did not return a valid image. Check server logs.",
            };
        }
    } catch (error: any) {
        // Provide detailed error feedback for debugging
        const errorMessage = error.response?.data?.error?.message || error.message || "An unknown error occurred.";
        console.error("Error calling Vertex AI endpoint:", { 
            status: error.response?.status,
            data: error.response?.data,
            message: errorMessage
        });
        return {
            success: false,
            message: `Failed to get prediction from Vertex AI: ${errorMessage}`,
        };
    }
}
