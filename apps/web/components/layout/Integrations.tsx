"use client";
import { useMemo } from "react";
import { SiGithub, SiSlack, SiJira, SiNotion, SiLinear } from "react-icons/si";
import { FaGoogle, FaMicrosoft, FaVideo } from "react-icons/fa";
import LogoLoop, { LogoItem } from "@/components/layout/react-bits/LogoLoop";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Integration {
  icon: React.ReactNode;
  label: string;
  bg: string;
  iconColor: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const INTEGRATIONS: Integration[] = [
  {
    icon: <SiGithub size={20} />,
    label: "GitHub",
    bg: "rgba(230,237,243,0.08)",
    iconColor: "#181717",
  },
  {
    icon: <SiSlack size={20} />,
    label: "Slack",
    bg: "rgba(224,30,90,0.1)",
    iconColor: "#4A154B",
  },
  {
    icon: <FaGoogle size={20} />,
    label: "Google Meet",
    bg: "rgba(0,137,123,0.1)",
    iconColor: "#00897B",
  },
  {
    icon: <FaMicrosoft size={20} />,
    label: "Microsoft Teams",
    bg: "rgba(123,131,235,0.1)",
    iconColor: "#7B83EB",
  },
  {
    icon: <FaVideo size={20} />,
    label: "Zoom",
    bg: "rgba(45,140,255,0.1)",
    iconColor: "#2D8CFF",
  },
  {
    icon: <SiNotion size={20} />,
    label: "Notion",
    bg: "rgba(255,255,255,0.07)",
    iconColor: "#000000",
  },
  {
    icon: <SiJira size={20} />,
    label: "Jira",
    bg: "rgba(38,132,255,0.1)",
    iconColor: "#0052CC",
  },
  {
    icon: <SiLinear size={20} />,
    label: "Linear",
    bg: "rgba(94,106,210,0.1)",
    iconColor: "#5E6AD2",
  },
];

const BG_COLOR = "hsl(240 10% 4%)";

// ─── Subcomponents ────────────────────────────────────────────────────────────

const IntegrationBadge = ({ icon, label, bg, iconColor }: Integration) => (
  <span
    className="flex items-center gap-2.5 rounded-full px-4 py-2 border border-border backdrop-blur-sm whitespace-nowrap"
    style={{ background: bg }}
  >
    <span style={{ color: iconColor }}>{icon}</span>
    <span className="text-sm font-medium text-muted-foreground">{label}</span>
  </span>
);

const FadeMask = ({ side }: { side: "left" | "right" }) => (
  <div
    className="pointer-events-none absolute top-0 h-full w-20 z-10"
    style={{
      [side]: 0,
      background: `linear-gradient(to ${side === "left" ? "right" : "left"}, ${BG_COLOR}, transparent)`,
    }}
  />
);

// ─── Main Component ───────────────────────────────────────────────────────────

const IntegrationsMarquee = ({ reverse = false }: { reverse?: boolean }) => {
  const logoItems = useMemo<LogoItem[]>(() => {
    const items = INTEGRATIONS.map((integration) => ({
      node: <IntegrationBadge {...integration} />,
      title: integration.label,
      ariaLabel: `${integration.label} Integration`,
    }));
    return [...items, ...items]; // double for seamless loop
  }, []);

  return (
    <div className="relative w-full overflow-hidden py-2">
      <FadeMask side="left" />
      <FadeMask side="right" />
      <LogoLoop
        logos={logoItems}
        speed={80 * (reverse ? -1 : 1)}
        gap={12}
        logoHeight={36}
        width="100%"
        fadeOut={false}
        pauseOnHover={false}
        style={{ minWidth: "100%" }}
        ariaLabel="Integrations"
      />
    </div>
  );
};

export default IntegrationsMarquee;
