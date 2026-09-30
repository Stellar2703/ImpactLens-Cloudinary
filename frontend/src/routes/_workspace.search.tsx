import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { SearchPanel } from "@/components/search-panel";
export const Route = createFileRoute("/_workspace/search")({
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s["q"] === "string" ? s["q"] : "" }),
  head: () => ({ meta: [{ title: "Semantic Search — ImpactLens" }, { name: "description", content: "Ask anything about your field evidence in plain language." }, { property: "og:title", content: "Semantic Search — ImpactLens" }, { property: "og:description", content: "Ask anything about your field evidence in plain language." }] }),
  component: Page,
});
function Page() {
  return (<><PageHeader title="Semantic Search" subtitle="Ask anything about your field evidence in plain language." /><SearchPanel /></>);
}
