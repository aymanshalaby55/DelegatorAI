"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  Link2,
  Send,
  GitBranch,
  MessageCircle,
  ListTodo,
  CheckSquare,
  Check,
  ArrowDown,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Data (shortened for brevity — use your full version)
// ─────────────────────────────────────────────────────────────────────────────

const demoTools = [
  { name: "GitHub", icon: GitBranch, color: "text-gray-200" },
  { name: "Slack", icon: MessageCircle, color: "text-red-400" },
  { name: "Jira", icon: ListTodo, color: "text-blue-400" },
  { name: "Asana", icon: CheckSquare, color: "text-pink-400" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Animation settings
// ─────────────────────────────────────────────────────────────────────────────

const SPRING = { type: "spring", stiffness: 300, damping: 24 };

const TOTAL_DURATION = 6.5; // ≈ time until last "Synced" appears + a little breathing room

const TIMING = {
  chip: 0.2,
  arrow1: 0.7,
  inputBox: 1.0,
  linkFly: 1.25,
  linkLand: 1.8,
  arrow2: 2.2,
  send: 2.6,
  arrow3: 3.0,
  toolsLabel: 3.4,
  tool: (i: number) => 3.6 + i * 0.15,
  synced: (i: number) => 3.9 + i * 0.15,
};

// Variants (same as before)
const fadeUp = (delay: number) => ({
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { ...SPRING, delay } },
});
const fadeIn = (delay: number) => ({
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4, delay } },
});
const scaleUp = (delay: number) => ({
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: { ...SPRING, delay } },
});
const arrowLine = (delay: number) => ({
  hidden: { scaleY: 0, opacity: 0, originY: "top" },
  show: { scaleY: 1, opacity: 1, transition: { duration: 0.5, delay } },
});
const arrowHead = (delay: number) => ({
  hidden: { opacity: 0, scale: 0.7 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, delay: delay + 0.4 },
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function Features() {
  const demoRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(demoRef, {
    amount: 0.2,
    once: false,
    margin: "-80px",
  });

  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    const interval = setInterval(
      () => {
        setCycle((prev) => prev + 1);
      },
      TOTAL_DURATION * 1000 + 800,
    ); // duration + small pause between loops

    return () => clearInterval(interval);
  }, [isInView]);

  // Force re-mount when visibility changes → ensures clean restart
  const shouldShowAnimation = isInView;

  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-gray-950 to-black">
      <div className="container mx-auto px-6 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-sm font-semibold uppercase tracking-wider text-blue-400">
            Features
          </span>
          <h2 className="mt-4 text-4xl md:text-5xl font-bold text-white">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Never Attend Again
            </span>
          </h2>
          <p className="mt-5 text-lg text-gray-400 max-w-3xl mx-auto">
            AI meeting intelligence — summaries, tasks, integrations, analytics.
          </p>
        </div>

        <div
          ref={demoRef}
          className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 sm:p-10 md:p-12 lg:p-16 xl:p-20 
             mb-20 shadow-2xl shadow-black/40 min-h-[520px] w-full max-w-none" // ← key changes here
        >
          {shouldShowAnimation ? (
            <DemoContent key={cycle} />
          ) : (
            <div className="h-[480px] flex items-center justify-center text-gray-500 text-sm">
              Scroll here to watch the demo loop
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Animated Demo (re-mounts on cycle change → restarts animation)
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// DemoContent – main layout change
// ─────────────────────────────────────────────────────────────────────────────

function DemoContent() {
  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-8 md:gap-10">
      {" "}
      {/* ← wider */}
      {/* Phase 1 – meeting link chip */}
      <motion.div
        variants={fadeUp(TIMING.chip)}
        initial="hidden"
        animate="show"
        className="w-full flex flex-col items-center"
      >
        <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 whitespace-nowrap">
          <Link2 className="h-5 w-5 text-blue-400" />
          <span className="text-base font-medium text-white">
            meet.google.com/abc-defg-hij
          </span>
        </div>
        <p className="mt-3 text-sm text-gray-500">Paste your meeting link</p>
      </motion.div>
      <PhaseArrow delay={TIMING.arrow1} />
      {/* Phase 2 – input simulation – make it wider */}
      <motion.div
        variants={fadeIn(TIMING.inputBox)}
        initial="hidden"
        animate="show"
        className="w-full max-w-2xl"
      >
        {/* ... the flying link stays the same ... */}

        <div className="rounded-2xl bg-white/5 border border-white/10 px-6 py-6 min-h-[80px] relative flex items-center justify-between gap-4">
          <motion.span
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ delay: TIMING.linkLand, duration: 0.3 }}
            className="absolute inset-x-6 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
          >
            Paste link here…
          </motion.span>

          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: TIMING.linkLand + 0.1 }}
            className="text-blue-300 font-medium truncate flex-1"
          >
            meet.google.com/abc-defg-hij
          </motion.span>

          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: TIMING.linkLand + 0.25 }}
            className="text-blue-400 font-semibold whitespace-nowrap"
          >
            Link added ✓
          </motion.span>
        </div>
      </motion.div>
      <PhaseArrow delay={TIMING.arrow2} />
      {/* Phase 3 – Send button – can stay compact */}
      <motion.div
        variants={fadeUp(TIMING.send)}
        initial="hidden"
        animate="show"
      >
        <div className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-white font-semibold whitespace-nowrap">
          <Send className="h-5 w-5 text-blue-400" />
          Send to AI assistant
        </div>
      </motion.div>
      <PhaseArrow delay={TIMING.arrow3} />
      {/* Phase 4 – Tools grid – make it responsive & wider */}
      <div className="w-full">
        <motion.p
          variants={fadeIn(TIMING.toolsLabel)}
          initial="hidden"
          animate="show"
          className="text-xs uppercase tracking-wider text-gray-500 text-center mb-6"
        >
          Syncs to your tools
        </motion.p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6 lg:gap-8 w-full">
          {demoTools.map((tool, i) => (
            <motion.div
              key={tool.name}
              variants={scaleUp(TIMING.tool(i))}
              initial="hidden"
              animate="show"
              className="rounded-2xl bg-white/5 border border-white/10 p-5 md:p-6 flex flex-col items-center gap-3 hover:border-blue-500/30 transition-colors aspect-square"
            >
              <div
                className={`h-14 w-14 md:h-16 md:w-16 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 ${tool.color}`}
              >
                <tool.icon className="h-7 w-7 md:h-8 md:w-8" />
              </div>
              <span className="text-sm md:text-base font-medium text-white">
                {tool.name}
              </span>
              <motion.div
                variants={fadeIn(TIMING.synced(i))}
                initial="hidden"
                animate="show"
                className="flex items-center gap-1.5 text-xs md:text-sm text-blue-400 font-semibold"
              >
                <Check className="h-4 w-4" />
                Synced
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PhaseArrow({ delay }: { delay: number }) {
  return (
    <div className="flex flex-col items-center my-4">
      <motion.div
        variants={arrowLine(delay)}
        initial="hidden"
        animate="show"
        className="w-0.5 h-12 bg-gradient-to-b from-blue-500/60 to-blue-500/10 rounded-full"
      />
      <motion.div variants={arrowHead(delay)} initial="hidden" animate="show">
        <ArrowDown
          className="h-6 w-6 -mt-2 text-blue-400/70"
          strokeWidth={2.5}
        />
      </motion.div>
    </div>
  );
}
