"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Mail, Calendar, LogOut, Shield, Puzzle } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { useIntegrations } from "@/hooks/useIntegrations";

function Avatar({ user }: { user: SupabaseUser }) {
  const initial = (user.email ?? user.id).charAt(0).toUpperCase();
  const avatarUrl =
    user.user_metadata?.avatar_url as string | undefined;

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt="Avatar"
        className="h-20 w-20 rounded-2xl object-cover"
        width={80}
        height={80}
      />
    );
  }

  return (
    <div className="h-20 w-20 rounded-2xl bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary select-none">
      {initial}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-0">
      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const { data: integrations = [] } = useIntegrations();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const connectedIntegrations = integrations.filter((i) => i.connected);

  const provider =
    (user?.app_metadata?.provider as string | undefined) ?? "email";
  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "–";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 md:p-6 lg:p-8 w-full space-y-6"
    >
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <User className="h-5 w-5 text-muted-foreground" />
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Profile
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Your account details and settings.
        </p>
      </div>

      {/* Avatar + name card */}
      <div className="glass rounded-2xl p-6 flex items-center gap-5">
        {loading ? (
          <Skeleton className="h-20 w-20 rounded-2xl shrink-0" />
        ) : user ? (
          <Avatar user={user} />
        ) : null}

        <div className="flex-1 min-w-0 space-y-1.5">
          {loading ? (
            <>
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3.5 w-48" />
              <Skeleton className="h-5 w-16 mt-2" />
            </>
          ) : (
            <>
              <p className="text-lg font-semibold text-foreground truncate">
                {(user?.user_metadata?.full_name as string | undefined) ||
                  user?.email?.split("@")[0] ||
                  "User"}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {user?.email ?? "No email"}
              </p>
              <Badge
                variant="outline"
                className="text-xs capitalize mt-1 border-border text-muted-foreground"
              >
                {provider}
              </Badge>
            </>
          )}
        </div>
      </div>

      {/* Account details */}
      <div className="glass rounded-2xl px-5">
        {loading ? (
          <div className="space-y-4 py-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <>
            <InfoRow icon={Mail} label="Email" value={user?.email ?? "–"} />
            <InfoRow
              icon={Shield}
              label="Auth Provider"
              value={provider.charAt(0).toUpperCase() + provider.slice(1)}
            />
            <InfoRow icon={Calendar} label="Member Since" value={createdAt} />
            <InfoRow
              icon={Puzzle}
              label="Connected Integrations"
              value={
                connectedIntegrations.length > 0
                  ? connectedIntegrations.map((i) => i.provider).join(", ")
                  : "None"
              }
            />
          </>
        )}
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        disabled={signingOut}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
      >
        <LogOut className="h-4 w-4" />
        {signingOut ? "Signing out…" : "Sign out"}
      </button>
    </motion.div>
  );
}
