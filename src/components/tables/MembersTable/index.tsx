"use client";

import { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { User } from "@/types";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";

async function getMembers() {
  console.log('Fetching members');
  const response = await fetch("/api/members");
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to fetch members: ${response.statusText}`);
  }
  const data = await response.json();
  console.log('Members data:', data);
  return data;
}

export function MembersTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const router = useRouter();
  
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("role") as string;
        return (
          <Badge
            variant={
              role === "ADMIN"
                ? "destructive"
                : role === "INSTRUCTOR"
                ? "warning"
                : "default"
            }
          >
            {role}
          </Badge>
        );
      },
    },
    {
      accessorKey: "memberStatus",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("memberStatus") as string;
        return (
          <Badge
            variant={
              status === "ACTIVE"
                ? "success"
                : status === "SUSPENDED"
                ? "destructive"
                : "secondary"
            }
          >
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => row.getValue("phone") || "N/A",
    },
    {
      accessorKey: "lastFlight",
      header: "Last Flight",
      cell: ({ row }) => {
        const date = row.getValue("lastFlight") as string;
        return date ? format(new Date(date), "MMM dd, yyyy") : "Never";
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const userId = row.original.id;
        return (
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => router.push(`/dashboard/members/view/${userId}`)}
          >
            <Eye className="h-4 w-4" />
            View
          </Button>
        );
      },
    },
  ];

  const { data: members = [], isLoading, error } = useQuery({
    queryKey: ["members"],
    queryFn: getMembers,
  });

  const table = useReactTable({
    data: members,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading members data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h2 className="text-red-800 font-semibold">Error loading members</h2>
        <p className="text-red-600">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No members found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
} 