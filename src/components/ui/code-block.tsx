
'use client';

import { useState } from 'react';
import { Button } from './button';
import { Check, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CodeBlockProps {
    code: string;
}

export function CodeBlock({ code }: CodeBlockProps) {
    const [hasCopied, setHasCopied] = useState(false);
    const { toast } = useToast();

    const copyToClipboard = () => {
        navigator.clipboard.writeText(code);
        setHasCopied(true);
        toast({ title: 'Copied to clipboard!' });
        setTimeout(() => setHasCopied(false), 2000);
    };

    return (
        <div className="relative">
            <Button
                size="icon"
                variant="ghost"
                className="absolute right-2 top-2 h-8 w-8"
                onClick={copyToClipboard}
            >
                {hasCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                <span className="sr-only">Copy code</span>
            </Button>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                <code className="text-sm text-muted-foreground">{code.trim()}</code>
            </pre>
        </div>
    );
}

    