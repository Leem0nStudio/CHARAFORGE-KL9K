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
import { PlusCircle } from "lucide-react";
import { AdminPageLayout } from '@/components/admin/admin-page-layout';

export default async function DataPacksAdminPage() {
  const dataPacks = await getDataPacks();

  return (
    <AdminPageLayout
      title="DataPacks"
      actions={
        <Button asChild>
          <Link href="/admin/datapacks/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New
          </Link>
        </Button>
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dataPacks.map((pack) => (
            <TableRow key={pack.id}>
              <TableCell className="font-medium">{pack.name}</TableCell>
              <TableCell>{pack.author}</TableCell>
              <TableCell>
                <Badge variant={pack.type === 'premium' ? 'destructive' : 'secondary'}>{pack.type}</Badge>
              </TableCell>
              <TableCell>{format(new Date(pack.createdAt), "PPP")}</TableCell>
              <TableCell>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/datapacks/${pack.id}`}>Edit</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
       {dataPacks.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            No datapacks found.
          </div>
        )}
    </AdminPageLayout>
  );
}
