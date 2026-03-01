"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, Github } from "lucide-react";
import { Button } from "@/components/ui/button";

// Import Supabase browser client (create this file if not already)
import { createClient } from "@/lib/supabase/client"; // ← path to your browser client

const GoogleLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <g clipPath="url(#a)">
      <path
        d="M17.64 9.204c0-.638-.057-1.25-.163-1.837H9v3.481h4.844a4.144 4.144 0 0 1-1.797 2.723v2.263h2.909c1.706-1.572 2.684-3.889 2.684-6.63Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.468-.806 5.957-2.19l-2.91-2.263c-.807.54-1.84.86-3.048.86-2.346 0-4.33-1.586-5.043-3.713H1.94v2.323A8.994 8.994 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.957 10.694A5.411 5.411 0 0 1 3.635 9c0-.59.102-1.16.282-1.694V4.983h-2.05A8.99 8.99 0 0 0 0 9c0 1.426.345 2.778.967 3.983l2.99-2.289Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.575c1.32 0 2.494.454 3.426 1.344l2.57-2.57C13.463.802 11.426 0 9 0A8.994 8.994 0 0 0 1.94 4.983l3.043 2.323C4.67 5.16 6.653 3.576 9 3.576v-.001Z"
        fill="#EA4335"
      />
    </g>
    <defs>
      <clipPath id="a">
        <rect width={18} height={18} fill="#fff" />
      </clipPath>
    </defs>
  </svg>
);

const Login = () => {
  const supabase = createClient(); // browser client from @supabase/ssr

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("Google sign-in error:", error);
      alert("Failed to start Google sign-in: " + error.message);
    }
  };

  const handleGitHubSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("GitHub sign-in error:", error);
      alert("Failed to start GitHub sign-in: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero bg-grid flex items-center justify-center p-4">
      <div className="absolute top-1/3 left-1/3 h-72 w-72 rounded-full bg-primary/10 blur-[100px] animate-pulse-glow" />
      <div
        className="absolute bottom-1/3 right-1/3 h-64 w-64 rounded-full bg-accent/10 blur-[100px] animate-pulse-glow"
        style={{ animationDelay: "1.5s" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass rounded-2xl p-8 w-full max-w-md relative z-10"
      >
        <Link href="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <span className="font-display text-xl font-bold text-foreground">
            Meeting<span className="text-gradient">Delegator</span>
          </span>
        </Link>

        <h1 className="font-display text-2xl font-bold text-center text-foreground mb-2">
          Welcome back
        </h1>
        <p className="text-center text-muted-foreground text-sm mb-8">
          Sign in to continue delegating
        </p>

        <div className="flex flex-col gap-3 mb-6">
          <Button
            variant="outline"
            className="w-full gap-2 border-border hover:bg-muted"
            onClick={handleGoogleSignIn}
          >
            <GoogleLogo className="h-4 w-4" /> Sign in with Google
          </Button>

          <Button
            variant="outline"
            className="w-full gap-2 border-border hover:bg-muted"
            onClick={handleGitHubSignIn}
          >
            <Github className="h-4 w-4" /> Sign in with GitHub
          </Button>
        </div>

        {/* Optional: keep "or" divider if you plan to add something later */}
        {/* <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div> */}

        {/* No email/password form anymore */}

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-primary hover:underline font-medium"
          >
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
