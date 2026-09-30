import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { SettingsPanel } from "@/components/settings-panel";
export const Route = createFileRoute("/_workspace/settings")({
  
  head: () => ({ meta: [{ title: "Settings — ImpactLens" }, { name: "description", content: "Organization, team, roles and integrations." }, { property: "og:title", content: "Settings — ImpactLens" }, { property: "og:description", content: "Organization, team, roles and integrations." }] }),
  component: Page,
});
function Page() {
  return (<><PageHeader title="Settings" subtitle="Organization, team, roles and integrations." /><SettingsPanel /></>);
}
