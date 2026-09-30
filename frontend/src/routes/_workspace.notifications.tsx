import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { Card } from "@/components/evidence";
import { getNotifications } from "@/lib/api";
export const Route = createFileRoute("/_workspace/notifications")({ component: Page });
function Page() { const [items, setItems] = useState<any[]>([]); const [error, setError] = useState(""); useEffect(() => { getNotifications().then(setItems).catch((e: Error) => setError(e.message)); }, []); return <><PageHeader title="Notifications" subtitle="Updates from AI analysis, reviews, reports and comparisons." />{error ? <p className="text-destructive">{error}</p> : <Card title={`${items.length} notifications`}><div className="space-y-2">{items.map((item) => <div key={item.id} className="rounded-lg border p-3 text-sm"><div className="font-semibold">{item.title}</div><p className="text-muted-foreground">{item.description}</p><div className="mt-2 text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</div>{item.mediaId && <Link to="/media/$id" params={{ id: item.mediaId }} className="mt-2 inline-block text-primary">Open evidence</Link>}</div>)}{items.length === 0 && <p className="text-muted-foreground">No notifications yet.</p>}</div></Card>}</>; }
