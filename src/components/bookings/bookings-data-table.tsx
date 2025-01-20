"use client";

import { useState } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Loader2 } from "lucide-react";
import { Booking, BookingStatus } from "@/types";

export function BookingsDataTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const supabase = createClientComponentClient();

  const columns: ColumnDef<Booking>[] = [
    {
      accessorKey: "startTime",
      header: "Start Time",
      cell: ({ row }) => format(new Date(row.getValue("startTime")), "PPp"),
    },
    {
      accessorKey: "endTime",
      header: "End Time",
      cell: ({ row }) => format(new Date(row.getValue("endTime")), "PPp"),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.getValue("type")}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as BookingStatus;
        return (
          <Badge
            className={
              status === "confirmed"
                ? "bg-green-100 text-green-800"
                : status === "unconfirmed"
                ? "bg-yellow-100 text-yellow-800"
                : status === "cancelled"
                ? "bg-red-100 text-red-800"
                : status === "flying"
                ? "bg-blue-100 text-blue-800"
                : status === "inProgress"
                ? "bg-purple-100 text-purple-800"
                : status === "complete"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-gray-100 text-gray-800"
            }
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "aircraft",
      header: "Aircraft",
      cell: ({ row }) => {
        const aircraft = row.original.aircraft;
        return aircraft ? (
          <div>
            <div className="font-medium">{aircraft.registration}</div>
            <div className="text-sm text-gray-500">
              {aircraft.aircraft_type?.type || 'Unknown Type'}
              {aircraft.aircraft_type?.model && ` - ${aircraft.aircraft_type.model}`}
            </div>
          </div>
        ) : (
          "N/A"
        );
      },
    },
    {
      accessorKey: "instructor",
      header: "Instructor",
      cell: ({ row }) => {
        const instructor = row.original.instructor;
        return instructor ? (
          <div>
            <div className="font-medium">{instructor.name}</div>
            <div className="text-sm text-gray-500">{instructor.email}</div>
          </div>
        ) : (
          "N/A"
        );
      },
    },
    {
      accessorKey: "user",
      header: "Member",
      cell: ({ row }) => {
        const user = row.original.user;
        return user ? (
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        ) : (
          "N/A"
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const booking = row.original;
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = `/dashboard/bookings/view/${booking.id}`}
          >
            View
          </Button>
        );
      },
    },
  ];

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      try {
        console.log('Starting bookings fetch...');
        
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        console.log('Session data:', { 
          hasSession: !!sessionData?.session,
          userId: sessionData?.session?.user?.id,
          error: sessionError
        });
        
        if (sessionError || !sessionData?.session) {
          console.log('No valid session found');
          return [];
        }

        const { data: userData, error: userError } = await supabase
          .from("User")
          .select("organizationId")
          .eq("id", sessionData.session.user.id)
          .single();

        console.log('User data:', {
          userData,
          organizationId: userData?.organizationId,
          error: userError
        });

        if (userError || !userData?.organizationId) {
          console.log('No organization ID found');
          return [];
        }

        console.log('Fetching bookings for organization:', userData.organizationId);

        const { data, error } = await supabase
          .from("Booking")
          .select(`
            *,
            aircraft:aircraft_id(
              id,
              registration,
              aircraft_type:type_id(
                id,
                type,
                model,
                year
              )
            ),
            instructor:instructor_id(
              id,
              name,
              email
            ),
            user:user_id(
              id,
              name,
              email
            ),
            booking_details:booking_details_id(
              route,
              comments,
              instructor_comment,
              passengers
            ),
            flight_times:booking_flight_times_id(
              start_hobbs,
              end_hobbs,
              start_tacho,
              end_tacho,
              flight_time
            )
          `)
          .eq("organization_id", userData.organizationId)
          .order("startTime", { ascending: false });

        console.log('Bookings query result:', {
          success: !error,
          count: data?.length,
          error: error?.message,
          details: error?.details,
          hint: error?.hint,
          data: data
        });

        if (error) {
          console.error('Error fetching bookings:', {
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          return [];
        }

        // Transform the data to ensure proper typing
        const transformedData = data?.map(booking => ({
          ...booking,
          aircraft: booking.aircraft ? {
            ...booking.aircraft,
            type: booking.aircraft.aircraft_type?.type || 'Unknown Type'
          } : null,
          instructor: booking.instructor || null,
          user: booking.user || null,
          booking_details: booking.booking_details || null,
          flight_times: booking.flight_times || null
        })) || [];

        return transformedData as Booking[];

      } catch (error) {
        console.error('Unexpected error in bookings fetch:', error);
        return [];
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Add logging for the rendered data
  console.log('Current bookings data:', bookings);

  const table = useReactTable({
    data: bookings,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center py-4 gap-2">
        <Input
          placeholder="Filter bookings..."
          value={(table.getColumn("type")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("type")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
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
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
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
    </div>
  );
} 