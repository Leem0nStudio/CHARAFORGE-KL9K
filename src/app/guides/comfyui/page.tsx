'use client';

import { BackButton } from '@/components/back-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CodeBlock } from '@/components/ui/code-block';

export default function ComfyUiGuidePage() {
    return (
        <div className="container py-12">
            <div className="max-w-4xl mx-auto space-y-8">
                <BackButton
                    title="ComfyUI on Kaggle Guide"
                    description="Launch your own free, powerful AI image generation server."
                />
                <Card>
                    <CardHeader>
                        <CardTitle>Step 1: Basic Content</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>This is a simplified version for testing purposes.</p>
                        <CodeBlock code={`console.log("Hello World");`} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}