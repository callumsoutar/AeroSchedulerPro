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
import { Aircraft } from "@/types";
import Image from "next/image";

const columns: ColumnDef<Aircraft>[] = [
  {
    accessorKey: "registration",
    header: "Registration",
  },
  {
    accessorKey: "type_id",
    header: "Type",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          variant={
            status === "ACTIVE"
              ? "success"
              : status === "MAINTENANCE"
              ? "warning"
              : "destructive"
          }
        >
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "photo_url",
    header: "Photo",
    cell: ({ row }) => {
      const photoUrl = row.getValue("photo_url") as string;
      return photoUrl ? (
        <div className="relative h-10 w-16">
          <Image
            src={photoUrl}
            alt={`${row.getValue("registration")}`}
            fill
            className="object-cover rounded-md"
          />
        </div>
      ) : (
        <span className="text-gray-400">No photo</span>
      );
    },
  },
  {
    accessorKey: "record_hobbs",
    header: "Hobbs",
    cell: ({ row }) => (
      <Badge variant={row.getValue("record_hobbs") ? "default" : "secondary"}>
        {row.getValue("record_hobbs") ? "Yes" : "No"}
      </Badge>
    ),
  },
  {
    accessorKey: "record_tacho",
    header: "Tacho",
    cell: ({ row }) => (
      <Badge variant={row.getValue("record_tacho") ? "default" : "secondary"}>
        {row.getValue("record_tacho") ? "Yes" : "No"}
      </Badge>
    ),
  },
];

async function getAircraft() {
  console.log('Fetching aircraft');
  const response = await fetch("/api/aircraft");
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to fetch aircraft: ${response.statusText}`);
  }
  const data = await response.json();
  console.log('Aircraft data:', data);
  return data;
}

export function AircraftTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const { data: aircraft = [], isLoading, error } = useQuery({
    queryKey: ["aircraft"],
    queryFn: getAircraft,
  });

  const table = useReactTable({
    data: aircraft,
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
        <div className="text-lg">Loading aircraft data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h2 className="text-red-800 font-semibold">Error loading aircraft</h2>
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
                  No aircraft found.
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