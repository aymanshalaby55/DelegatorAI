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
    await supabase.auth.signOut();
    setUser(null);
    router.refresh();
  };

  // Handles navigation to login page
  const handleLogin = () => {
    router.push("/login");
  };
  // Handles navigation to login page ("Get Started" also goes to login)
  const handleGetStarted = () => {
    router.push("/login");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Logo + nav links grouped left */}
        <div className="hidden md:flex items-center gap-12">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="font-display font-bold text-primary-foreground text-sm">
                MD
              </span>
            </div>
            <span className="font-display font-bold text-xl text-white whitespace-nowrap">
              Meeting Delegator
            </span>
          </Link>
          <div className="flex items-center gap-1 border-l border-white/10 pl-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-white/70 hover:text-white px-3 py-2 rounded-md hover:bg-white/5 transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        {/* Logo only on mobile */}
        <Link href="/" className="flex md:hidden items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="font-display font-bold text-primary-foreground text-sm">
              MD
            </span>
          </div>
          <span className="font-display font-bold text-xl text-white">
            Meeting Delegator
          </span>
        </Link>

        {/* Right: actions */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 min-w-0">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover border border-white/20 shrink-0"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary/30 border border-white/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-primary">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-sm font-medium text-white/90 truncate max-w-[120px]">
                  {displayName}
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-white/70 hover:text-white hover:bg-white/10"
                onClick={handleSignOut}
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <Button
                size="sm"
                className="bg-white/15 text-white border border-white/20 hover:bg-white/25 text-base px-5"
                onClick={handleLogin}
              >
                Log In
              </Button>
              <Button
                size="sm"
                className="glow-primary text-base px-5"
                onClick={handleGetStarted}
              >
                Get Started Free
              </Button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-white/10 overflow-hidden"
          >
            <div className="flex flex-col gap-4 p-6">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-white/80 hover:text-white transition-colors text-base font-medium"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              {user ? (
                <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover border border-white/20"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary/30 border border-white/20 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="text-white/90 font-medium flex-1 truncate">
                    {displayName}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white/70"
                    onClick={() => {
                      setMobileOpen(false);
                      handleSignOut();
                    }}
                  >
                    Sign out
                  </Button>
                </div>
              ) : (
                <div className="flex gap-3 pt-2">
                  <Button
                    size="sm"
                    className="bg-white/15 text-white border border-white/20 hover:bg-white/25 flex-1"
                    onClick={() => {
                      setMobileOpen(false);
                      handleLogin();
                    }}
                  >
                    Log In
                  </Button>
                  <Button
                    size="sm"
                    className="glow-primary flex-1"
                    onClick={() => {
                      setMobileOpen(false);
                      handleGetStarted();
                    }}
                  >
                    Get Started
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
