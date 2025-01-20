"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useRedirectIfNotAuthenticated } from "@/hooks/useRedirectIfNotAuthenticated";
import Loading from "@/components/Loading";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useRedirectIfNotAuthenticated(
    ["OWNER", "ADMIN", "MEMBER", "INSTRUCTOR"], // Allow all authenticated users
    "/sign-in"
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

  return <DashboardLayout>{children}</DashboardLayout>;
} 