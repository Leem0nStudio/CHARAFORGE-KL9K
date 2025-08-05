
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface LogPanelProps {
    logs: string[];
}

export function LogPanel({ logs }: LogPanelProps) {
    return (
        <Card className="sticky top-20 shadow-lg h-[600px] flex flex-col">
            <CardHeader>
                <CardTitle className="font-headline text-xl">Process Log</CardTitle>
                <CardDescription>Real-time output from the extraction process.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden">
                <ScrollArea className="h-full w-full pr-4">
                    {logs.length > 0 ? (
                        <div className="text-xs text-muted-foreground font-mono space-y-2">
                            {logs.map((log, index) => (
                                <p key={index}>{log}</p>
                            ))}
                        </div>
                    ) : (
                         <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                            Logs will appear here...
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
