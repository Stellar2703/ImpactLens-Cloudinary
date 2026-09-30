import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import { images } from "@/lib/demo-data";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — ImpactLens" },
      { name: "description", content: "Sign in to your ImpactLens evidence workspace." },
      { property: "og:title", content: "Sign in — ImpactLens" },
      { property: "og:description", content: "Access your organization's impact evidence library." },
    ],
  }),
  component: Login,
});

type Mode = "login" | "signup" | "forgot";

function Login() {
  const [mode, setMode] = useState<Mode>("login");
  const navigate = useNavigate();
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "forgot") { toast.success("Reset link sent (demo)"); setMode("login"); return; }
    navigate({ to: mode === "signup" ? "/onboarding" : "/dashboard" });
  };
  const input = "h-11 w-full rounded-lg border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring";
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col p-8">
        <Logo />
        <form onSubmit={submit} className="m-auto w-full max-w-sm space-y-4">
          <h1 className="text-3xl font-medium">{mode === "login" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset password"}</h1>
          <p className="text-sm text-muted-foreground">Demo Mode: any details work.</p>
          {mode === "signup" && <input className={input} placeholder="Full name" defaultValue="Abinisha A S" />}
          <input className={input} type="email" placeholder="Work email" defaultValue="abinisha@terragreen.org" />
          {mode !== "forgot" && <input className={input} type="password" placeholder="Password" defaultValue="demo-password" />}
          {mode === "login" && (
            <select className={input} defaultValue="tg" aria-label="Organization">
              <option value="tg">Terra Green Foundation</option>
              <option value="mw">Ministry of Water Resources</option>
              <option value="cc">Coastal Care Trust</option>
            </select>
          )}
          <button className="h-11 w-full rounded-lg bg-navy text-sm font-semibold text-navy-foreground">
            {mode === "login" ? "Sign in" : mode === "signup" ? "Continue" : "Send reset link"}
          </button>
          <div className="flex justify-between text-sm">
            {mode === "login" ? (
              <>
                <button type="button" onClick={() => setMode("forgot")} className="text-muted-foreground hover:text-foreground">Forgot password?</button>
                <button type="button" onClick={() => setMode("signup")} className="font-semibold text-primary">Create account</button>
              </>
            ) : (
              <button type="button" onClick={() => setMode("login")} className="font-semibold text-primary">Back to sign in</button>
            )}
          </div>
          <Link to="/dashboard" className="block text-center text-xs text-muted-foreground underline">Skip to demo workspace</Link>
        </form>
      </div>
      <div className="relative hidden lg:block">
        <img src={images.coastAfter} alt="Volunteers cleaning a beach" width={1024} height={768} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/40 to-transparent" />
        <blockquote className="absolute bottom-12 left-12 right-12 text-navy-foreground">
          <p className="font-display text-3xl">"We cut quarterly reporting from three weeks to one afternoon."</p>
          <footer className="mt-4 text-sm text-sidebar-foreground">Programme Director, Coastal Care Trust</footer>
        </blockquote>
      </div>
    </div>
  );
}
