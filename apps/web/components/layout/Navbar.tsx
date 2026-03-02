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

  const handleLogin = () => {
    router.push("/login");
  };

  const handleGetStarted = () => {
    router.push("/login");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/50 backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Desktop: Logo + Navigation */}
        <div className="hidden lg:flex items-center gap-10 xl:gap-14">
          <Link href="/" className="flex items-center gap-2">
            {/* Logo: perfectly circular & flush, as in image */}
            <Image
              src={LogoImg}
              alt="Meeting Delegator Logo"
              width={62}
              height={62}
              quality={100}
              className="rounded-full object-cover h-10 w-10 border-none"
              priority={true}
            />
            <span className="font-bold text-xl text-white font-sans whitespace-nowrap">
              Meeting Delegator
            </span>
          </Link>

          <div className="flex items-center gap-2 border-l border-white/10 pl-10">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-semibold text-white/90 hover:text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-all duration-200"
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
            width={32}
            height={32}
            quality={100}
            className="rounded-full object-cover h-8 w-8 border-none"
            priority={true}
          />
          <span className="font-bold text-lg sm:text-xl text-white font-sans">
            Meeting Delegator
          </span>
        </Link>

        {/* Desktop: User / Auth buttons */}
        <div className="hidden lg:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="User avatar"
                    className="h-9 w-9 rounded-full object-cover border border-white/20"
                    width={36}
                    height={36}
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-primary/30 border border-white/20 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-sm font-medium text-white/90 truncate max-w-[140px] xl:max-w-[180px]">
                  {displayName}
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-white/80 hover:text-white hover:bg-white/10 px-3"
                onClick={handleSignOut}
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3 sm:gap-4">
              <Button
                size="sm"
                className="bg-black/12 hover:bg-white/20 text-white border border-white/15 text-sm sm:text-base px-4 sm:px-6 h-9 sm:h-10"
                onClick={handleLogin}
              >
                Log In
              </Button>
              <Button
                size="sm"
                className="glow-primary text-sm sm:text-base px-5 sm:px-7 h-9 sm:h-10"
                onClick={handleGetStarted}
              >
                Get Started
              </Button>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          className="lg:hidden text-white p-1 -mr-1"
          onClick={() => setMobileOpen(!mobileOpen)}
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
            className="lg:hidden glass border-t border-white/10 overflow-hidden"
          >
            <div className="flex flex-col gap-5 p-6 pt-5 pb-8">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-base sm:text-lg font-semibold text-white hover:text-white py-1.5 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </a>
              ))}

              {user ? (
                <div className="flex items-center gap-4 pt-4 mt-2 border-t border-white/10">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt="User avatar"
                      width={44}
                      height={44}
                      className="h-11 w-11 rounded-full object-cover border border-white/20"
                    />
                  ) : (
                    <div className="h-11 w-11 rounded-full bg-primary/30 border border-white/20 flex items-center justify-center text-lg font-semibold text-primary">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-white/90 font-medium truncate">
                      {displayName}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    className="text-red-300 hover:text-red-200 hover:bg-red-950/30 px-4"
                    onClick={async () => {
                      setMobileOpen(false);
                      await handleSignOut();
                    }}
                  >
                    Sign out
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4 pt-5 mt-2">
                  <Button
                    className="bg-white/12 hover:bg-white/20 border border-white/15 h-11 text-base font-medium"
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
