import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { ReportsPanel } from "@/components/reports-panel";
export const Route = createFileRoute("/_workspace/reports")({
  
  head: () => ({ meta: [{ title: "Report Builder — ImpactLens" }, { name: "description", content: "Assemble donor and government reports from verified evidence." }, { property: "og:title", content: "Report Builder — ImpactLens" }, { property: "og:description", content: "Assemble donor and government reports from verified evidence." }] }),
  component: Page,
});
function Page() {
  return (<><PageHeader title="Report Builder" subtitle="Assemble donor and government reports from verified evidence." /><ReportsPanel /></>);
}
