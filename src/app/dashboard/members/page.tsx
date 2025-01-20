"use client";

import { MembersTable } from "@/components/tables/MembersTable";
import { useRedirectIfNotAuthenticated } from "@/hooks/useRedirectIfNotAuthenticated";
import Loading from "@/components/Loading";

export default function MembersPage() {
  const { user, isLoading } = useRedirectIfNotAuthenticated(
    ["OWNER", "ADMIN"], // Only allow these roles
    "/unauthorized" // Redirect unauthorized users to this page
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
        <h1 className="text-3xl font-bold">Members</h1>
      </div>
      <MembersTable />
    </div>
  );
}
