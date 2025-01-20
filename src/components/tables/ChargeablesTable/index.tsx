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
import { Chargeable } from "@/types";

const columns: ColumnDef<Chargeable>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      return (
        <Badge
          variant={
            type === "AIRCRAFT"
              ? "success"
              : type === "INSTRUCTION"
              ? "warning"
              : type === "MEMBERSHIP"
              ? "default"
              : "secondary"
          }
        >
          {type}
        </Badge>
      );
    },
  },
  {
    accessorKey: "unitPrice",
    header: "Unit Price",
    cell: ({ row }) => {
      const price = row.getValue("unitPrice") as number;
      return new Intl.NumberFormat('en-NZ', {
        style: 'currency',
        currency: 'NZD'
      }).format(price);
    },
  },
  {
    accessorKey: "unitPriceInclTax",
    header: "Price (incl. Tax)",
    cell: ({ row }) => {
      const price = row.getValue("unitPriceInclTax") as number;
      return new Intl.NumberFormat('en-NZ', {
        style: 'currency',
        currency: 'NZD'
      }).format(price);
    },
  },
  {
    accessorKey: "taxRate",
    header: "Tax Rate",
    cell: ({ row }) => {
      const rate = row.getValue("taxRate") as number;
      return `${(rate * 100).toFixed(1)}%`;
    },
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.getValue("isActive") ? "success" : "destructive"}>
        {row.getValue("isActive") ? "Active" : "Inactive"}
      </Badge>
    ),
  },
];

async function getChargeables() {
  const response = await fetch("/api/chargeables");
  if (!response.ok) {
    throw new Error("Failed to fetch chargeables");
  }
  return response.json();
}

export function ChargeablesTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const { data: chargeables = [], isLoading, error } = useQuery({
    queryKey: ["chargeables"],
    queryFn: getChargeables,
  });

  const table = useReactTable({
    data: chargeables,
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
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading chargeables</div>;
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
                  No chargeables found.
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