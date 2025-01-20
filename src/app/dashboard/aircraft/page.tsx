"use client";

import { AircraftTable } from "@/components/tables/AircraftTable";
import { useRedirectIfNotAuthenticated } from "@/hooks/useRedirectIfNotAuthenticated";
import Loading from "@/components/Loading";

export default function AircraftPage() {
  const { user, isLoading } = useRedirectIfNotAuthenticated(
    ["OWNER", "ADMIN"],
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
        <h1 className="text-3xl font-bold">Aircraft</h1>
      </div>
      <AircraftTable />
    </div>
  );
} 