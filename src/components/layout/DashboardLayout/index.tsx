"use client";

import { useUser } from "@/hooks/useUser";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Plane, 
  Calendar, 
  Users, 
  UserCircle, 
  CalendarClock, 
  FileText, 
  CheckSquare,
  Settings,
  DollarSign
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const sidebarLinks = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard
  },
  {
    label: "Aircraft",
    href: "/dashboard/aircraft",
    icon: Plane
  },
  {
    label: "Scheduler",
    href: "/dashboard/scheduler",
    icon: Calendar
  },
  {
    label: "Staff",
    href: "/dashboard/staff",
    icon: Users
  },
  {
    label: "Members",
    href: "/dashboard/members",
    icon: UserCircle
  },
  {
    label: "Bookings",
    href: "/dashboard/bookings",
    icon: CalendarClock
  },
  {
    label: "Chargeables",
    href: "/dashboard/chargeables",
    icon: DollarSign
  },
  {
    label: "Invoices",
    href: "/dashboard/invoices",
    icon: FileText
  },
  {
    label: "Tasks",
    href: "/dashboard/tasks",
    icon: CheckSquare
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings
  }
];

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user } = useUser();
  const supabaseClient = useSupabaseClient();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/sign-in");
    }
  }, [user, router]);

  const handleLogout = async () => {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      console.log(error);
    }
    router.push("/");
  };

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div className="w-64 bg-[#0D121F] text-white p-4">
        <div className="mb-8">
          <Link href="/" className="text-2xl font-bold">
            AeroManager
          </Link>
        </div>
        <nav className="space-y-2">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors text-lg"
              >
                <Icon size={24} />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <header className="h-16 border-b flex items-center justify-end px-8 bg-white">
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback>
                {user?.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8 bg-gray-50 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout; 