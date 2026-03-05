"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Video,
  FileText,
  CheckSquare,
  Puzzle,
  BarChart3,
  Clock,
  User,
  MoreHorizontal,
  LogOut,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import Image from "next/image";
import toast from "react-hot-toast";

const sidebarItems = [
  { label: "Meetings", icon: Video, href: "/dashboard" },
  { label: "Summaries", icon: FileText, href: "/dashboard/summaries" },
  { label: "Tasks", icon: CheckSquare, href: "/dashboard/tasks" },
  { label: "Integrations", icon: Puzzle, href: "/dashboard/integrations" },
  { label: "Analytics", icon: BarChart3, href: "/dashboard/analytics" },
  { label: "History", icon: Clock, href: "/dashboard/history" },
  { label: "Profile", icon: User, href: "/dashboard/profile" },
];

const DashboardSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const displayName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split("@")[0] ??
    "User";

  const avatarUrl =
    user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null;

  const handleSignOut = async () => {
    const supabase = createClient();
    toast.loading("Signing out...", { id: "logout" });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.dismiss("logout");
        toast.error("Logout failed: " + error.message);
        return;
      }
      setUser(null);
      router.refresh();
      toast.dismiss("logout");
      toast.success("Logged out successfully.");
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.dismiss("logout");
        toast.error("Error during logout: " + error.message);
      } else {
        toast.dismiss("logout");
        toast.error("Error during logout: Unknown error");
      }
    }
  };

  return (
    <aside className="w-56 border-r border-border flex flex-col justify-between glass-strong min-h-screen left-0 top-0 z-30">
      <div>
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-5 border-b border-border"
        >
          <Logo size={32} />
        </Link>
        <nav className="flex flex-col gap-0.5 p-2 mt-1">
          {sidebarItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-muted text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground truncate">
          {user ? (
            <>
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="User avatar"
                  className="h-7 w-7 rounded-full object-cover border border-white/20"
                  width={28}
                  height={28}
                />
              ) : (
                <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="truncate max-w-[100px]">{displayName}</span>
              <button
                className="ml-auto px-1 text-muted-foreground hover:text-foreground transition"
                aria-label="Sign out"
                onClick={handleSignOut}
                type="button"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                ?
              </div>
              <span className="truncate max-w-[100px]">Not logged in</span>
              <Link
                href="/login"
                className="ml-auto px-1 text-muted-foreground hover:text-foreground transition"
                aria-label="Log in"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
