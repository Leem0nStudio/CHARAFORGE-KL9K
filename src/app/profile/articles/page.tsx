
'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from "date-fns";
import { useAuth } from '@/hooks/use-auth';
import { getArticlesForUser } from "@/app/actions/articles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, PlusCircle, Newspaper } from "lucide-react";
import type { Article } from '@/types/article';

function UserArticlesContent() {
    const { authUser, loading: authLoading } = useAuth();
    const [articles, setArticles] = useState<Article[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (authUser) {
            getArticlesForUser(authUser.uid)
                .then(setArticles)
                .finally(() => setIsLoading(false));
        }
    }, [authUser]);

    if (authLoading || isLoading) {
         return (
            <div className="flex items-center justify-center p-16">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    return (
         <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>My Articles</CardTitle>
                    <CardDescription>A list of all the articles you've written.</CardDescription>
                </div>
                <Button asChild>
                    <Link href="/profile/articles/new">
                        <PlusCircle className="mr-2" /> New Article
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                {articles.length > 0 ? (
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
                                    <Link href={`/profile/articles/${article.id}`}>Edit</Link>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-lg">
                        <Newspaper className="mx-auto h-12 w-12 mb-4" />
                        <h3 className="text-lg font-semibold">You haven't written any articles yet.</h3>
                        <p className="text-sm">Click "New Article" to share your first story.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export default function UserArticlesPage() {
    return (
        <div className="container py-8 max-w-4xl mx-auto">
            <Suspense fallback={
                 <div className="flex items-center justify-center p-16">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            }>
                <UserArticlesContent />
            </Suspense>
        </div>
    );
}
