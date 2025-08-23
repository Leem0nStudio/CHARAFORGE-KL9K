
import { getArticle } from '@/app/actions/articles';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { ArticleForm } from './article-form';

interface EditArticlePageProps {
  params: { id: string };
}

export default async function EditArticlePage({ params }: EditArticlePageProps) {
  const { id } = params;
  const isNew = id === 'new';
  const article = isNew ? null : await getArticle(id);
  const title = isNew ? 'Create Article' : `Edit: ${article?.title || 'Article'}`;

  return (
    <AdminPageLayout title={title}>
      <ArticleForm article={article} />
    </AdminPageLayout>
  );
}
