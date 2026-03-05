"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import Image from "next/image";
import LogoImg from "@/public/logo.jpg";
import { Logo } from "@/components/ui/Logo";
import toast from "react-hot-toast";

const navItems = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Integrations", href: "#integrations" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      // Print access token
      if (session?.access_token) {
        console.log("Access token:", session.access_token);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      // Print access token on auth state change
      if (session?.access_token) {
        console.log("Access token (onAuthStateChange):", session.access_token);
      }
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

  const handleLogin = () => router.push("/login");
  const handleGetStarted = () => router.push("/login");
  const handleDashboard = () => router.push("/dashboard");

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-xl shadow-sm border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4 sm:px-8 max-w-7xl">
        {/* Left: Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="hidden lg:flex items-center gap-2">
            <Logo size={38} text={true} />
          </Link>
          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-2.5">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-muted-foreground px-2.5 py-1.5 rounded-md hover:text-foreground hover:bg-muted transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        {/* Mobile: Logo only */}
        <Link href="/" className="flex lg:hidden items-center gap-2">
          <Image
            src={LogoImg}
            alt="Meeting Delegator Logo"
            width={34}
            height={34}
            priority
            className="rounded-full object-cover h-9 w-9 border border-border bg-muted"
          />
          <span className="font-bold text-base sm:text-lg text-foreground font-sans">
            Meeting Delegator
          </span>
        </Link>

        {/* User/Auth for Desktop */}
        <div className="hidden lg:flex items-center gap-5">
          {user ? (
            <>
              <div className="inline-flex items-center gap-3 min-w-0">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="User avatar"
                    className="h-9 w-9 rounded-full object-cover border border-border"
                    width={36}
                    height={36}
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-muted text-foreground/50 border border-border flex items-center justify-center text-sm font-bold uppercase select-none">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium text-foreground truncate max-w-[140px] xl:max-w-[180px]">
                  {displayName}
                </span>
              </div>
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 text-white text-xs font-semibold px-4 py-2 shadow"
                onClick={handleDashboard}
              >
                Dashboard
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                onClick={handleSignOut}
                aria-label="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                className="bg-muted hover:bg-muted/70 text-foreground border border-border text-sm px-4 h-9"
                onClick={handleLogin}
              >
                Log In
              </Button>
              <Button
                size="sm"
                className="glow-primary text-sm px-5 h-9"
                onClick={handleGetStarted}
              >
                Get Started
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          className="lg:hidden text-foreground p-2 rounded-md focus:outline-none hover:bg-muted/60 transition"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile menu dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="lg:hidden glass border-t border-border/50 overflow-hidden"
          >
            <div className="flex flex-col gap-6 px-4 py-6 pt-5">
              <div className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="text-base font-medium text-foreground/80 hover:text-foreground transition mb-1"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
              </div>

              {user ? (
                <div className="flex items-center gap-3 pt-4 mt-2 border-t border-border">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt="User avatar"
                      width={44}
                      height={44}
                      className="h-11 w-11 rounded-full object-cover border border-border"
                    />
                  ) : (
                    <div className="h-11 w-11 rounded-full bg-muted text-foreground/50 border border-border flex items-center justify-center text-lg font-bold uppercase select-none">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-foreground font-medium truncate text-base block">
                      {displayName}
                    </span>
                  </div>
                  <Button
                    className="bg-primary hover:bg-primary/90 text-white text-base font-semibold px-5 py-2 shadow"
                    onClick={() => {
                      setMobileOpen(false);
                      handleDashboard();
                    }}
                  >
                    Dashboard
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-red-500 hover:text-red-600 hover:bg-destructive/10 transition px-4"
                    onClick={async () => {
                      setMobileOpen(false);
                      await handleSignOut();
                    }}
                  >
                    Sign out
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-4 pt-5 mt-2 border-t border-border">
                  <Button
                    className="bg-muted hover:bg-muted/80 border border-border h-11 text-base font-medium"
                    onClick={() => {
                      setMobileOpen(false);
                      handleLogin();
                    }}
                  >
                    Log In
                  </Button>
                  <Button
                    className="glow-primary h-11 text-base font-medium"
                    onClick={() => {
                      setMobileOpen(false);
                      handleGetStarted();
                    }}
                  >
                    Get Started Free
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
