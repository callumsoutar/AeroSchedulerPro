"use client";

import { useRouter } from "next/navigation";
import { useRedirectIfNotAuthenticated } from "@/hooks/useRedirectIfNotAuthenticated";
import Loading from "@/components/Loading";
import { BookingsDataTable } from "@/components/bookings/bookings-data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function BookingsPage() {
  const router = useRouter();
  const { user, isLoading } = useRedirectIfNotAuthenticated(
    ["OWNER", "ADMIN", "INSTRUCTOR", "MEMBER"],
    "/unauthorized"
  );

  if (isLoading) {
    return <Loading />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Bookings</h1>
        <Button onClick={() => router.push('/dashboard/bookings/new')} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Booking
        </Button>
      </div>
      <BookingsDataTable />
    </div>
  );
} 