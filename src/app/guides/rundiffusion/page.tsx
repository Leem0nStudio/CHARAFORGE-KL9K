
import { BackButton } from '@/components/back-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function RunDiffusionGuidePage() {
    return (
        <div className="container py-12">
            <div className="max-w-4xl mx-auto space-y-8">
                 <BackButton 
                    title="RunDiffusion Integration Guide"
                    description="Connect your private, high-performance RunDiffusion server to CharaForge."
                 />
                
                <Card>
                    <CardHeader>
                        <CardTitle>What is RunDiffusion?</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>
                            <Link href="https://rundiffusion.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">RunDiffusion</Link> is a service that provides you with a private, high-performance server for running image generation models like Stable Diffusion. It's an excellent option for users who want more power, privacy, and control without needing to set up a complex local environment.
                        </p>
                        <p className="mt-2">
                            CharaForge can connect directly to your RunDiffusion session, allowing you to use your private server as a backend for the character generator.
                        </p>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Step 1: Launch Your RunDiffusion Session</CardTitle>
                         <CardDescription>Start your server on the RunDiffusion platform.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ol className="list-decimal list-inside space-y-2">
                            <li>Log in to your RunDiffusion account and start a new session. Ensure you select an option that uses the **ComfyUI** interface, as this is the backend CharaForge will connect to.</li>
                            <li>Once your session is running, you will be given a unique URL to access your private server. It will look something like <Badge variant="outline">https://[your-session-id].rundiffusion.com</Badge>.</li>
                            <li>Keep this URL handy. This is the key to connecting CharaForge.</li>
                        </ol>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Step 2: Configure the Model in CharaForge</CardTitle>
                        <CardDescription>Tell CharaForge how to communicate with your new server.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ol className="list-decimal list-inside space-y-4">
                            <li>Navigate to the <Link href="/admin/models" className="text-primary underline">AI Models</Link> page in the CharaForge Admin Panel.</li>
                            <li>Click <Badge>Add New...</Badge> to create a new model configuration.</li>
                            <li>In the form, set the following options:</li>
                               <ul className="list-disc list-inside pl-6 space-y-2 mt-2">
                                  <li>**Orchestration Engine:** Select <Badge variant="secondary">RunDiffusion</Badge>.</li>
                                  <li>**Server URL:** Paste your unique RunDiffusion session URL here, and make sure to add <Badge variant="outline">/prompt</Badge> to the end. For example: <Badge variant="outline">https://[your-session-id].rundiffusion.com/prompt</Badge></li>
                                  <li>**Default Base Model Filename:** Enter the filename of the default checkpoint you want to use in your RunDiffusion session (e.g., <Badge variant="outline">epicrealism_naturalSinRC1.safetensors</Badge>). This is required for the integration to work.</li>
                                  <li>**ComfyUI Workflow (JSON):** In your RunDiffusion ComfyUI interface, get your workflow ready. Click the <Badge>Save (API Format)</Badge> button. This will download a JSON file. Open that file, copy its entire contents, and paste it into this field in CharaForge.</li>
                               </ul>
                        </ol>
                         <p className="mt-4 font-semibold">That's it! When you use this newly configured model in the character generator, CharaForge will now send image generation jobs directly to your private RunDiffusion server.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
