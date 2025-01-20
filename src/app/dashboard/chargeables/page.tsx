"use client";

import { ChargeablesTable } from "@/components/tables/ChargeablesTable";
import { useRedirectIfNotAuthenticated } from "@/hooks/useRedirectIfNotAuthenticated";
import Loading from "@/components/Loading";

export default function ChargeablesPage() {
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
        <h1 className="text-3xl font-bold">Chargeables</h1>
      </div>
      <ChargeablesTable />
    </div>
  );
} 