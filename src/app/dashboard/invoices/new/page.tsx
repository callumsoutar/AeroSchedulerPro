"use client";

import { useRedirectIfNotAuthenticated } from "@/hooks/useRedirectIfNotAuthenticated";
import NewInvoiceForm from "@/components/forms/new-invoice-form";
import Loading from "@/components/Loading";

export default function NewInvoicePage() {
  const { user, isLoading: authLoading } = useRedirectIfNotAuthenticated(
    ["OWNER", "ADMIN"],
    "/unauthorized"
  );

  if (authLoading) {
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
    <div className="container py-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">New Invoice</h1>
            <p className="text-sm text-gray-500 mt-1">Create a new invoice for a member</p>
          </div>
          <div className="bg-gray-100 px-3 py-1 rounded-md">
            <span className="text-sm font-medium text-gray-600">DRAFT</span>
          </div>
        </div>
        <NewInvoiceForm />
      </div>
    </div>
  );
} 