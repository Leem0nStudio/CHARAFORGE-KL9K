
'use client';

import { useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import type { Character } from '@/types/character';
import { updateCharacter, type UpdateCharacterState } from '@/app/characters/actions';
import { useToast } from '@/hooks/use-toast';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
        </Button>
    );
}

export function EditCharacterForm({ character }: { character: Character }) {
    const { toast } = useToast();
    const router = useRouter();

    const initialState: UpdateCharacterState = { success: false, message: '' };
    const updateCharacterWithId = updateCharacter.bind(null, character.id);
    const [state, dispatch] = useFormState(updateCharacterWithId, initialState);

    useEffect(() => {
        if (state.success) {
            toast({
                title: 'Success!',
                description: state.message,
            });
            // Redirect to the characters page on successful update
            router.push('/characters');
        }
    }, [state, toast, router]);

    return (
        <form action={dispatch} className="space-y-6">
            {state.message && !state.success && (
                 <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Update Failed</AlertTitle>
                    <AlertDescription>{state.message}</AlertDescription>
                </Alert>
            )}
            <div className="space-y-2">
                <label htmlFor="name" className="font-semibold text-sm">Character Name</label>
                <Input 
                    id="name"
                    name="name"
                    defaultValue={character.name}
                    className="w-full"
                    required
                />
            </div>
            <div className="space-y-2">
                <label htmlFor="biography" className="font-semibold text-sm">Biography</label>
                <Textarea
                    id="biography"
                    name="biography"
                    defaultValue={character.biography}
                    className="min-h-[200px] w-full"
                    required
                />
            </div>
            <div className="flex justify-end gap-2">
                <Button variant="outline" asChild>
                    <Link href="/characters">Cancel</Link>
                </Button>
                <SubmitButton />
            </div>
        </form>
    );
}

