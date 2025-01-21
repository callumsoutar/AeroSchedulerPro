"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface MemberAccountOverviewProps {
  memberId: string;
}

interface AccountSummary {
  balance: number;
  openInvoices: {
    count: number;
    total: number;
  };
}

async function fetchAccountSummary(memberId: string): Promise<AccountSummary> {
  const response = await fetch(`/api/members/${memberId}/account`);
  if (!response.ok) {
    throw new Error('Failed to fetch account summary');
  }
  return response.json();
}

export function MemberAccountOverview({ memberId }: MemberAccountOverviewProps) {
  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['accountSummary', memberId],
    queryFn: () => fetchAccountSummary(memberId),
  });

  if (isLoading) {
    return <AccountOverviewSkeleton />;
  }

  if (error) {
    return (
      <div className="text-red-500">
        Error loading account information
      </div>
    );
  }

  const balance = summary?.balance ?? 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Current Balance */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Current Balance</h3>
            <div className="flex items-baseline space-x-2">
              <span className={cn(
                "text-3xl font-bold",
                balance < 0 ? "text-red-500" : "text-green-500"
              )}>
                ${Math.abs(balance).toFixed(2)}
              </span>
              <span className={cn(
                "text-sm",
                balance < 0 ? "text-red-500/70" : "text-green-500/70"
              )}>
                {balance < 0 ? 'DR' : 'CR'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Open Invoices */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Open Invoices</h3>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold">{summary?.openInvoices.count ?? 0}</span>
              <span className="text-sm text-muted-foreground ml-2">pending</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AccountOverviewSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 