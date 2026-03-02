"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Link2, Send, Check, ArrowDown } from "lucide-react";
import { SiGithub, SiSlack, SiJira, SiNotion } from "react-icons/si";
import Particals from "@/components/layout/Particals";
// Removed unused import: import Particles from "@/components/Particles";
import Hyperspeed from "./react-bits/Hyperspeed";
const demoTools = [
  { name: "GitHub", icon: SiGithub, color: "#ffffff" },
  { name: "Slack", icon: SiSlack, color: "#E01E5A" },
  { name: "Jira", icon: SiJira, color: "#2684FF" },
  { name: "Notion", icon: SiNotion, color: "#ffffff" },
];

const TOTAL_DURATION = 6.5;

const T = {
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

const FLY_DUR = T.linkLand - T.linkFly;
const sp = { type: "spring", stiffness: 300, damping: 24 };

const fadeUp = (d: number) => ({
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { ...sp, delay: d } },
});
const fadeIn = (d: number) => ({
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4, delay: d } },
});
const scaleUp = (d: number) => ({
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: { ...sp, delay: d } },
});
const arrowLine = (d: number) => ({
  hidden: { scaleY: 0, opacity: 0, originY: "top" },
  show: { scaleY: 1, opacity: 1, transition: { duration: 0.5, delay: d } },
});
const arrowHead = (d: number) => ({
  hidden: { opacity: 0, scale: 0.7 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.3, delay: d + 0.4 } },
});

export default function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, {
    amount: 0.2,
    once: false,
    margin: "-80px",
  });
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const id = setInterval(
      () => setCycle((c) => c + 1),
      TOTAL_DURATION * 1000 + 800,
    );
    return () => clearInterval(id);
  }, [isInView]);

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      {/* Particles background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <Particals />
      </div>
      {/* Content */}
      {/* Make the wrapper and Hyperspeed container full width */}
      <div
        ref={containerRef}
        className="relative z-10 flex flex-col items-center justify-center w-full"
      >
        <section className="py-20 md:py-28 w-full">
          <div className="container mx-auto px-0 max-w-none flex flex-col items-center w-full">
            {/* Header */}
            <div className="text-center mb-16">
              <span className="text-xs font-semibold uppercase tracking-widest text-blue-400">
                Features
              </span>
              <h2 className="mt-5 text-4xl md:text-5xl font-bold text-white leading-tight">
                Everything You Need to{" "}
                <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  Never Attend Again
                </span>
              </h2>
              <p className="mt-4 text-gray-400 max-w-md mx-auto text-sm leading-relaxed">
                AI meeting intelligence — summaries, tasks, integrations,
                analytics.
              </p>
            </div>

            {/* Demo content sitting on transparent background */}
            <div className="relative w-full flex flex-col items-center">
              {/* Hyperspeed should be visible but not conflict visually with other components (dimmed and behind content) */}
              <div
                className="absolute inset-0 z-0 pointer-events-none w-full h-full"
                style={{
                  filter: "brightness(0.65) blur(1.5px)", // Dim and soften the Hyperspeed effect
                  maskImage:
                    "linear-gradient(to bottom, transparent 0, #000 60px, #000 92%, transparent 100%)",
                  WebkitMaskImage:
                    "linear-gradient(to bottom, transparent 0, #000 60px, #000 92%, transparent 100%)",
                }}
                aria-hidden
              >
                <Hyperspeed />
              </div>
              <div className="relative z-10 w-full flex flex-col items-center">
                {isInView ? (
                  <DemoContent key={cycle} />
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-600 text-xs">
                    Scroll here to watch the demo
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function DemoContent() {
  return (
    <div className="flex flex-col items-center gap-10 w-full">
      {/* Step 1 – Chip */}
      <motion.div
        variants={fadeUp(T.chip)}
        initial="hidden"
        animate="show"
        className="flex flex-col items-center gap-2 w-full"
      >
        <p className="text-[10px] uppercase tracking-widest text-gray-500 text-center">
          Paste your meeting link
        </p>
        <div className="relative flex items-center gap-2.5 px-6 py-3 rounded-lg bg-white/5 border border-white/10 shadow-md mx-auto w-full max-w-xs sm:max-w-sm justify-center backdrop-blur-md backdrop-brightness-110">
          <Link2 size={14} className="text-blue-400 shrink-0" />
          {/* Static text fades out when clone starts flying */}
          <motion.span
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ delay: T.linkFly, duration: 0.08 }}
            className="text-sm text-white font-medium whitespace-nowrap"
          >
            meet.google.com/abc-defg-hij
          </motion.span>
          {/* Flying clone */}
          <motion.span
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 1, 1, 0], y: [0, 48, 88] }}
            transition={{
              delay: T.linkFly,
              duration: FLY_DUR,
              opacity: { times: [0, 0.05, 0.88, 1] },
              y: { times: [0, 0.4, 1], ease: ["easeIn", "easeOut"] },
            }}
            className="text-sm text-white font-medium whitespace-nowrap"
            style={{
              position: "absolute",
              left: "2.8rem",
              top: "0.75rem",
              zIndex: 5,
              pointerEvents: "none",
            }}
          >
            meet.google.com/abc-defg-hij
          </motion.span>
        </div>
      </motion.div>

      <PhaseArrow delay={T.arrow1} />

      {/* Step 2 – Input */}
      <motion.div
        variants={fadeIn(T.inputBox)}
        initial="hidden"
        animate="show"
        className="w-full max-w-md"
      >
        <div className="relative flex items-center justify-between gap-4 px-6 py-3.5 rounded-lg bg-white/5 border border-white/10 min-h-[52px] mx-auto shadow-md backdrop-blur-md backdrop-brightness-110">
          <motion.span
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ delay: T.linkLand, duration: 0.25 }}
            className="absolute text-sm text-gray-500 pointer-events-none"
            style={{ left: "1.25rem" }}
          >
            Paste link here…
          </motion.span>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: T.linkLand + 0.1, duration: 0.2 }}
            className="text-sm text-blue-300 font-medium truncate flex-1"
          >
            meet.google.com/abc-defg-hij
          </motion.span>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: T.linkLand + 0.3 }}
            className="flex items-center gap-1.5 text-xs text-blue-400 font-semibold whitespace-nowrap"
          >
            <Check size={12} /> Link added
          </motion.span>
        </div>
      </motion.div>

      <PhaseArrow delay={T.arrow2} />

      {/* Step 3 – Send */}
      <motion.div
        variants={scaleUp(T.send)}
        initial="hidden"
        animate="show"
        className="w-full flex justify-center"
      >
        <div className="flex items-center gap-2.5 px-8 py-3 rounded-lg bg-blue-500/10 border border-blue-500/25 text-white font-semibold text-sm whitespace-nowrap shadow-md backdrop-blur-md backdrop-brightness-110">
          <Send size={14} className="text-blue-400" />
          Send to AI assistant
        </div>
      </motion.div>

      <PhaseArrow delay={T.arrow3} />

      {/* Step 4 – Tools */}
      <div className="w-full flex flex-col items-center">
        <motion.p
          variants={fadeIn(T.toolsLabel)}
          initial="hidden"
          animate="show"
          className="text-[10px] uppercase tracking-widest text-blue-200 text-center mb-4"
        >
          Syncs to your tools
        </motion.p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg mx-auto">
          {demoTools.map((tool, i) => (
            <motion.div
              key={tool.name}
              variants={scaleUp(T.tool(i))}
              initial="hidden"
              animate="show"
              className="flex flex-col items-center gap-2.5 py-5 px-2 rounded-xl bg-white/10 border border-white/10 hover:border-white/20 transition-colors shadow backdrop-blur-md backdrop-brightness-110"
            >
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                <tool.icon size={20} color={tool.color} />
              </div>
              <span className="text-xs font-medium text-white">
                {tool.name}
              </span>
              <motion.span
                variants={fadeIn(T.synced(i))}
                initial="hidden"
                animate="show"
                className="flex items-center gap-1 text-[10px] text-blue-400 font-semibold"
              >
                <Check size={9} /> Synced
              </motion.span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PhaseArrow({ delay }: { delay: number }) {
  return (
    <div className="flex flex-col items-center">
      <motion.div
        variants={arrowLine(delay)}
        initial="hidden"
        animate="show"
        className="w-px h-8 rounded-full"
        style={{
          background:
            "linear-gradient(to bottom, rgba(96,165,250,0.5), rgba(96,165,250,0.05))",
        }}
      />
      <motion.div variants={arrowHead(delay)} initial="hidden" animate="show">
        <ArrowDown
          size={16}
          className="text-blue-400/60 -mt-1"
          strokeWidth={2.5}
        />
      </motion.div>
    </div>
  );
}
