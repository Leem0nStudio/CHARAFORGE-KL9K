
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ExtractionOptions } from '@/app/sprite-extractor/page';

interface OptionsPanelProps {
    options: ExtractionOptions;
    setOptions: (options: ExtractionOptions) => void;
    disabled?: boolean;
}

export function OptionsPanel({ options, setOptions, disabled }: OptionsPanelProps) {
    return (
        <Card className="sticky top-20 shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-xl">Extraction Options</CardTitle>
                <CardDescription>Fine-tune the sprite detection algorithm.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-3">
                    <Label htmlFor="minArea">Minimum Area ({options.minArea}px)</Label>
                    <Slider
                        id="minArea"
                        min={10}
                        max={1000}
                        step={10}
                        value={[options.minArea]}
                        onValueChange={(value) => setOptions({ ...options, minArea: value[0] })}
                        disabled={disabled}
                    />
                    <CardDescription className="text-xs">
                        Ignores any detected shapes smaller than this area.
                    </CardDescription>
                </div>

                 <div className="space-y-3">
                    <Label htmlFor="engine">Detection Engine</Label>
                    <Select 
                        value={options.engine} 
                        onValueChange={(value: 'sharp' | 'opencv') => setOptions({ ...options, engine: value })}
                        disabled={disabled}
                    >
                        <SelectTrigger id="engine">
                            <SelectValue placeholder="Select engine..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="sharp">Sharp (Fast)</SelectItem>
                            <SelectItem value="opencv" disabled>OpenCV (Precise)</SelectItem>
                        </SelectContent>
                    </Select>
                     <CardDescription className="text-xs">
                        The underlying library used for image analysis.
                    </CardDescription>
                </div>

                 <div className="space-y-3">
                    <Label htmlFor="resample">Resample Mode</Label>
                     <Select 
                        value={options.resampleMode}
                        onValueChange={(value: 'nearest' | 'bilinear') => setOptions({ ...options, resampleMode: value })}
                        disabled
                     >
                        <SelectTrigger id="resample">
                            <SelectValue placeholder="Select mode..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="nearest">Nearest Neighbor</SelectItem>
                            <SelectItem value="bilinear">Bilinear</SelectItem>
                        </SelectContent>
                    </Select>
                     <CardDescription className="text-xs">
                        Algorithm for resizing sprites (coming soon).
                    </CardDescription>
                </div>
            </CardContent>
        </Card>
    );
}
