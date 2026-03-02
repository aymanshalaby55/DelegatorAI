"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FaGithub } from "react-icons/fa";
import toast from "react-hot-toast";

import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

export default function Login() {
  const supabase = createClient();

  const handleGoogleSignIn = async () => {
    toast.loading("Redirecting to Google...", { id: "login-google" });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast.dismiss("login-google");
      console.error("Google sign-in error:", error);
      toast.error("Failed to start Google sign-in: " + error.message);
    }
  };

  const handleGitHubSignIn = async () => {
    toast.loading("Redirecting to GitHub...", { id: "login-github" });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast.dismiss("login-github");
      console.error("GitHub sign-in error:", error);
      toast.error("Failed to start GitHub sign-in: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero bg-grid flex items-center justify-center p-4 sm:p-6 md:p-8">
      {/* Background glow blobs — kept but made slightly smaller on mobile */}
      <div className="absolute top-1/4 left-1/4 sm:top-1/3 sm:left-1/3 h-56 w-56 sm:h-72 sm:w-72 rounded-full bg-primary/10 blur-[80px] sm:blur-[100px] animate-pulse-glow" />
      <div
        className="absolute bottom-1/4 right-1/4 sm:bottom-1/3 sm:right-1/3 h-48 w-48 sm:h-64 sm:w-64 rounded-full bg-accent/10 blur-[80px] sm:blur-[100px] animate-pulse-glow"
        style={{ animationDelay: "1.5s" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 w-full max-w-md lg:max-w-lg relative z-10 border border-border/40 shadow-xl"
      >
        <Link
          href="/"
          className="flex items-center gap-2.5 justify-center mb-8 md:mb-10"
        >
          <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <span className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Meeting<span className="text-gradient">Delegator</span>
          </span>
        </Link>

        <h1 className="font-display text-2xl sm:text-3xl font-bold text-center text-foreground mb-2">
          Welcome back
        </h1>
        <p className="text-center text-muted-foreground text-base sm:text-lg mb-8">
          Sign in to continue delegating
        </p>

        <div className="flex flex-col gap-4 sm:gap-5">
          <Button
            variant="outline"
            className="w-full h-11 sm:h-12 text-base sm:text-lg font-medium gap-3 border-border hover:bg-muted/80 transition-colors"
            onClick={handleGoogleSignIn}
          >
            <Image
              src="/icons/Google.png"
              alt="Google"
              width={20}
              height={20}
            />
            <span className="text-sm font-medium">Sign in with Google</span>
          </Button>

          <Button
            variant="outline"
            className="w-full h-11 sm:h-12 text-base sm:text-lg font-medium gap-3 border-border hover:bg-muted/80 transition-colors"
            onClick={handleGitHubSignIn}
          >
            <FaGithub size={20} />
            <span className="text-sm font-medium">Sign in with GitHub</span>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
