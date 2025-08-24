
'use client';

import { useTransition, useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Bold, Italic, Code, Link as LinkIcon, Image as ImageIcon, Save } from 'lucide-react';
import type { Article } from '@/types/article';
import { UpsertArticleSchema } from '@/types/article';
import { upsertArticle } from '@/app/actions/articles';
import { CharacterImageSelectorDialog } from './character-image-selector';

// Re-exporting the type for the page component to use
export type { Article };

const slugify = (text: string) =>
  text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');

// The form now uses the base Article type, not UpsertArticle, for its props
export function ArticleForm({ article }: { article: Article | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const form = useForm<Omit<Article, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'author'>>({
    resolver: zodResolver(UpsertArticleSchema),
    defaultValues: {
      title: article?.title || '',
      slug: article?.slug || '',
      content: article?.content || '',
      status: article?.status || 'draft',
    },
  });

  const onSubmit = (values: Omit<Article, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'author'>) => {
    startTransition(async () => {
      const result = await upsertArticle({ id: article?.id, ...values });
      if (result.success) {
        toast({ title: 'Success!', description: result.message });
        if (!article?.id && result.articleId) {
          router.push(`/profile/articles/${result.articleId}`);
        }
        router.refresh();
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
      }
    });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    form.setValue('title', title);
    if (!form.formState.dirtyFields.slug) {
      form.setValue('slug', slugify(title));
    }
  };
  
  const insertMarkdown = (syntax: 'bold' | 'italic' | 'code' | 'link' | 'image', url?: string) => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    let newText = '';

    switch(syntax) {
        case 'bold': newText = `**${selectedText || 'bold text'}**`; break;
        case 'italic': newText = `*${selectedText || 'italic text'}*`; break;
        case 'code': newText = `\`${selectedText || 'code'}\``; break;
        case 'link': newText = `[${selectedText || 'link text'}](${url || 'https://'})`; break;
        case 'image': newText = `![${selectedText || 'alt text'}](${url || 'https://'})`; break;
    }
    
    const updatedValue = textarea.value.substring(0, start) + newText + textarea.value.substring(end);
    form.setValue('content', updatedValue, { shouldDirty: true });
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = start + newText.length;
  }
  
  const handleImageInsert = (url: string) => {
    insertMarkdown('image', url);
  }

  return (
    <>
    <CharacterImageSelectorDialog isOpen={isSelectorOpen} onClose={() => setIsSelectorOpen(false)} onImageSelect={handleImageInsert} />
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-24 sm:pb-0">
       <Card>
        <CardHeader>
          <CardTitle>Article Metadata</CardTitle>
          <CardDescription>Basic information and publishing status.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...form.register('title')} onChange={handleTitleChange} />
              {form.formState.errors.title && <p className="text-destructive text-sm">{form.formState.errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input id="slug" {...form.register('slug')} />
              {form.formState.errors.slug && <p className="text-destructive text-sm">{form.formState.errors.slug.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select onValueChange={(value) => form.setValue('status', value as 'draft' | 'published')} defaultValue={form.getValues('status')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Content</CardTitle>
            <CardDescription>Write your article using the Markdown editor below.</CardDescription>
        </CardHeader>
        <CardContent>
             <div className="border rounded-md">
                <div className="p-2 border-b flex items-center gap-1">
                    <Button type="button" variant="ghost" size="icon" onClick={() => insertMarkdown('bold')}><Bold /></Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => insertMarkdown('italic')}><Italic /></Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => insertMarkdown('code')}><Code /></Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => insertMarkdown('link')}><LinkIcon /></Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setIsSelectorOpen(true)}><ImageIcon /></Button>
                </div>
                <Textarea
                    ref={contentRef}
                    id="content"
                    {...form.register('content')}
                    className="min-h-[400px] font-mono border-0 rounded-t-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    placeholder="## My Awesome Article..."
                />
            </div>
            {form.formState.errors.content && <p className="text-destructive text-sm mt-2">{form.formState.errors.content.message}</p>}
        </CardContent>
      </Card>
      
      <div className="hidden sm:flex justify-end">
        <Button type="submit" disabled={isPending || !form.formState.isDirty}>
          {isPending && <Loader2 className="animate-spin mr-2" />}
          {article ? 'Save Changes' : 'Create Article'}
        </Button>
      </div>

       {/* Mobile Action Footer */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-4 border-t z-10">
          <Button type="submit" className="w-full" disabled={isPending || !form.formState.isDirty}>
                {isPending ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2"/>}
                {article ? 'Save Changes' : 'Create Article'}
            </Button>
      </div>
    </form>
    </>
  );
}
