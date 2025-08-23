
'use client';

import { useTransition } from 'react';
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
import { Loader2 } from 'lucide-react';
import type { Article } from '@/types/article';
import { UpsertArticleSchema } from '@/types/article';
import { upsertArticle } from '@/app/actions/articles';

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
          router.push(`/profile/articles`);
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

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Article Editor</CardTitle>
          <CardDescription>Write your article content using Markdown.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Content (Markdown)</Label>
            <Textarea id="content" {...form.register('content')} className="min-h-[400px] font-mono" />
            {form.formState.errors.content && <p className="text-destructive text-sm">{form.formState.errors.content.message}</p>}
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending || !form.formState.isDirty}>
              {isPending && <Loader2 className="animate-spin mr-2" />}
              {article ? 'Save Changes' : 'Create Article'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
