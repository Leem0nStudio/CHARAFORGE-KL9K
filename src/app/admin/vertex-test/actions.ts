
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

    let projectId: string | undefined;
    let serviceAccount: any;

    try {
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        if (!serviceAccountKey) {
            throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.");
        }
        serviceAccount = JSON.parse(serviceAccountKey);
        projectId = serviceAccount.project_id;
    } catch (e) {
        console.error("Could not parse service account key to find Project ID", e);
        return { success: false, message: `Failed to parse service account key. Error: ${e instanceof Error ? e.message : 'Unknown error'}`};
    }
    
    const location = 'us-central1';
    const endpointId = '1497098330914684928';
    
    if (!projectId) {
        return { success: false, message: "Could not determine Google Cloud Project ID from server environment." };
    }

    const endpointUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/endpoints/${endpointId}:predict`;

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
        // Authenticate explicitly by passing the parsed service account credentials.
        const auth = new GoogleAuth({
            credentials: serviceAccount,
            scopes: 'https://www.googleapis.com/auth/cloud-platform',
        });
        const client = await auth.getClient();
        
        const response = await client.request({
            url: endpointUrl,
            method: 'POST',
            data: payload,
        });

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
