
import Link from 'next/link';
import { getDataPacks } from "./actions";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, User, Calendar } from "lucide-react";
import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { cn } from '@/lib/utils';

export default async function DataPacksAdminPage() {
  const dataPacks = await getDataPacks();
  const breadcrumbs = [{ label: 'DataPacks', href: '/admin/datapacks' }];

  return (
    <AdminPageLayout
      title="DataPacks"
      breadcrumbs={breadcrumbs}
      actions={
        <Button asChild>
          <Link href="/admin/datapacks/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New
          </Link>
        </Button>
      }
    >
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Author</TableHead>
              <TableHead className="hidden md:table-cell">Type</TableHead>
              <TableHead className="hidden lg:table-cell">Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataPacks.map((pack) => (
              <TableRow key={pack.id}>
                <TableCell className="font-medium">
                  <div className="font-bold">{pack.name}</div>
                   <div className="flex items-center gap-4 text-sm text-muted-foreground sm:hidden mt-2">
                        <span className="flex items-center gap-1"><User className="h-3 w-3" /> {pack.author}</span>
                        <Badge variant={pack.type === 'premium' ? 'destructive' : 'secondary'} className="w-fit">{pack.type}</Badge>
                   </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">{pack.author}</TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant={pack.type === 'premium' ? 'destructive' : 'secondary'}>{pack.type}</Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell">{format(new Date(pack.createdAt), "PPP")}</TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/datapacks/${pack.id}`}>Edit</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
       {dataPacks.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            No datapacks found.
          </div>
        )}
    </AdminPageLayout>
  );
}
