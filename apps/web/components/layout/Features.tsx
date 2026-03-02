"use client";

import { motion } from "framer-motion";
import { Video, Brain, FileText, GitBranch } from "lucide-react";

const steps = [
  {
    icon: Video,
    step: "01",
    title: "Join Any Meeting",
    description:
      "Connect Zoom, Google Meet, or Teams. Our AI bot joins automatically via calendar sync.",
  },
  {
    icon: Brain,
    step: "02",
    title: "Real-Time AI Analysis",
    description:
      "Live transcription with NLP that understands context, decisions, and action items as they happen.",
  },
  {
    icon: FileText,
    step: "03",
    title: "Smart Summaries",
    description:
      "Get hierarchical summaries with key decisions, open questions, and sentiment analysis — instantly.",
  },
  {
    icon: GitBranch,
    step: "04",
    title: "Auto-Assign Tasks",
    description:
      "Tasks are extracted, prioritized, and pushed to GitHub, Slack, Jira, or Asana in one click.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="section-padding relative scroll-mt-24"
    >
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-accent uppercase tracking-widest mb-3 block">
            How It Works
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold">
            From Meeting to <span className="gradient-text">Action</span> in
            Minutes
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-6 relative group hover:border-primary/20 transition-colors"
            >
              <span className="text-5xl font-display font-bold text-muted/60 absolute top-4 right-4">
                {step.step}
              </span>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                <step.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
