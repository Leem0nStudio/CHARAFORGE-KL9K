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
import { DataPackForm } from "./datapack-form";

export default async function DataPacksAdminPage() {
  const dataPacks = await getDataPacks();

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          DataPacks
        </h1>
        <div className="flex items-center space-x-2">
          <DataPackForm>
             <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New
            </Button>
          </DataPackForm>
        </div>
      </div>
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
              <TableCell>{format(pack.createdAt, "PPP")}</TableCell>
              <TableCell>
                <DataPackForm dataPackId={pack.id}>
                    <Button variant="outline" size="sm">Edit</Button>
                </DataPackForm>
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
    </div>
  );
}
