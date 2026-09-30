export function reportLovableError(error: unknown, context?: Record<string, unknown>) {
  console.error("ImpactLens frontend error", { error, ...context });
}
