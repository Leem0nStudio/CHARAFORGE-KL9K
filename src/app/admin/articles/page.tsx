
import Link from 'next/link';
import { getArticles } from "@/app/actions/articles";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { AdminPageLayout } from '@/components/admin/admin-page-layout';

export default async function ArticlesAdminPage() {
  const articles = await getArticles();

  return (
    <AdminPageLayout
      title="Articles"
      actions={
        <Button asChild>
          <Link href="/admin/articles/new">
            <PlusCircle className="mr-2 h-4 w-4" /> New Article
          </Link>
        </Button>
      }
    >
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles.map((article) => (
              <TableRow key={article.id}>
                <TableCell className="font-medium">{article.title}</TableCell>
                <TableCell>
                  <Badge variant={article.status === 'published' ? 'default' : 'secondary'}>
                    {article.status}
                  </Badge>
                </TableCell>
                <TableCell>{format(new Date(article.createdAt), "PPP")}</TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/articles/${article.id}`}>Edit</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
       {articles.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            No articles found.
          </div>
        )}
    </AdminPageLayout>
  );
}
