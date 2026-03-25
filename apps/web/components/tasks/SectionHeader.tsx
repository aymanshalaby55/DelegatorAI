import { Badge } from "@/components/ui/badge";

interface SectionHeaderProps {
  icon: React.ElementType;
  label: string;
  count: number;
  iconClass: string;
}

export function SectionHeader({
  icon: Icon,
  label,
  count,
  iconClass,
}: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`h-4 w-4 ${iconClass}`} />
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <Badge variant="secondary" className="text-xs h-5 px-1.5 rounded-full">
        {count}
      </Badge>
    </div>
  );
}
