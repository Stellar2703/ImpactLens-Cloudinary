import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getCloudinaryStatus, getHealth } from "@/lib/api";
import { Card } from "./evidence";

export function SettingsPanel() {
  const [health, setHealth] = useState<{
    status: string;
    version: string;
    persistence: { mode: string; detail: string };
  } | null>(null);
  const [cloudinary, setCloudinary] = useState<{
    status: string;
    message: string;
    cloudName?: string;
    isConfigured: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getHealth(), getCloudinaryStatus()])
      .then(([nextHealth, nextCloudinary]) => {
        setHealth(nextHealth);
        setCloudinary(nextCloudinary);
      })
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : "Unable to load system status")
      )
      .finally(() => setLoading(false));
  }, []);

  const isCloudinaryActive = Boolean(
    cloudinary?.isConfigured && cloudinary.status === "connected"
  );

  const status = (ok: boolean, label: string, detail: string) => (
    <div className="flex items-center justify-between border-b py-3 last:border-b-0">
      <div>
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-xs text-muted-foreground">{detail}</div>
      </div>
      {ok ? (
        <CheckCircle2 className="h-5 w-5 text-success" />
      ) : (
        <CircleAlert className="h-5 w-5 text-warning" />
      )}
    </div>
  );

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card title="Workspace">
        <div className="space-y-1">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            status(
              health?.status === "healthy",
              "API service",
              health ? `Version ${health.version}` : "Unavailable"
            )
          )}
          {loading
            ? null
            : status(
                health?.persistence.mode === "live",
                "Database",
                health?.persistence.detail || "Unavailable"
              )}
        </div>
      </Card>
      <Card title="Integrations">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : (
          status(
            isCloudinaryActive,
            "Cloudinary media storage",
            cloudinary?.message || (isCloudinaryActive ? "Connected and operational" : "Not configured")
          )
        )}
        {!loading && cloudinary?.cloudName && cloudinary.cloudName !== "local_storage" && (
          <div className="pt-3 text-xs text-muted-foreground">
            Cloud: {cloudinary.cloudName}
          </div>
        )}
      </Card>
    </div>
  );
}
