import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Logo({ invert }: { invert?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="relative grid h-8 w-8 place-items-center rounded-lg bg-primary">
        <span className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground" />
        <span className="absolute bottom-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary-foreground" />
      </span>
      <span className={cn("font-display text-xl font-semibold", invert ? "text-sidebar-accent-foreground" : "text-foreground")}>
        ImpactLens
      </span>
    </Link>
  );
}
