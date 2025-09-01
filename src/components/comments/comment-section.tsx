
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addComment } from '@/app/actions/comments';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import type { Comment } from '@/app/actions/comments';
import { v4 as uuidv4 } from 'uuid';


interface CommentSectionProps {
    entityType: 'character' | 'datapack' | 'article';
    entityId: string;
    initialComments: Comment[]; 
}

export function CommentSection({ entityType, entityId, initialComments }: CommentSectionProps) {
    const { authUser, userProfile } = useAuth();
    const [comments, setComments] = useState<Comment[]>(initialComments);
    const [newCommentContent, setNewCommentContent] = useState('');
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleAddComment = () => {
        if (!authUser || !userProfile) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to comment.' });
            return;
        }
        const content = newCommentContent.trim();
        if (!content) {
            toast({ variant: 'destructive', title: 'Error', description: 'Comment cannot be empty.' });
            return;
        }

        // Optimistic update
        const tempId = uuidv4();
        const optimisticComment: Comment = {
            id: tempId,
            entity_type: entityType,
            entity_id: entityId,
            user_id: authUser.id,
            user_name: userProfile.displayName || 'You',
            user_photo_url: userProfile.photoURL || undefined,
            content,
            created_at: Date.now(),
            updated_at: Date.now(),
        };

        setComments(prev => [...prev, optimisticComment]);
        setNewCommentContent('');

        startTransition(async () => {
            const result = await addComment({
                entityType,
                entityId,
                content,
            });

            if (result.success && result.comment) {
                // Replace optimistic comment with real one from server
                setComments(prev => prev.map(c => c.id === tempId ? result.comment! : c));
            } else {
                // Revert optimistic update on failure
                toast({ variant: 'destructive', title: 'Error', description: result.error || 'Failed to post comment.' });
                setComments(prev => prev.filter(c => c.id !== tempId));
            }
        });
    };

    return (
        <div className="mt-8">
            <h3 className="font-semibold text-muted-foreground mb-4">Comments ({comments.length})</h3>
            {/* Comment Input */}
            {authUser ? (
                <div className="flex items-start space-x-4 mb-6">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={userProfile?.photoURL || undefined} alt={userProfile?.displayName || 'Your Avatar'} />
                        <AvatarFallback>{userProfile?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <Textarea
                            placeholder="Write a comment..."
                            value={newCommentContent}
                            onChange={(e) => setNewCommentContent(e.target.value)}
                            rows={3}
                            disabled={isPending}
                        />
                        <Button 
                            onClick={handleAddComment} 
                            className="mt-2" 
                            disabled={isPending || !newCommentContent.trim()}
                        >
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Post Comment
                        </Button>
                    </div>
                </div>
            ) : (
                <p className="text-center text-sm text-muted-foreground mb-6">Log in to leave a comment.</p>
            )}

            {/* Comments List */}
            <div className="space-y-6">
                {comments.length > 0 ? (
                    comments.map((comment) => (
                        <div key={comment.id} className="flex items-start space-x-4">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={comment.user_photo_url || undefined} alt={comment.user_name || 'User'} />
                                <AvatarFallback>{comment.user_name.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="font-semibold">{comment.user_name}</p>
                                    <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{comment.content}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-sm text-muted-foreground">No comments yet. Be the first to leave one!</p>
                )}
            </div>
        </div>
    );
}
