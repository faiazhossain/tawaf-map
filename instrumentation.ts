/**
 * Startup observability line (OBS-001).
 *
 * Runs once per server boot (standalone included). Emits ONE parseable JSON
 * line describing which deployment-critical env flags actually arrived, so a
 * wrong-env deploys are visible in `docker logs` instead of discovered by
 * users hitting a blank map or dead routing.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { version } = await import("./package.json");
  console.log(
    JSON.stringify({
      msg: "tawaf-map-start",
      version,
      nodeEnv: process.env.NODE_ENV ?? "(unset)",
      barikoiRoutingKey: Boolean(process.env.BARIKOI_API_KEY ?? process.env.MAP_API_ACCESS_TOKEN),
      barikoiStyleKey: Boolean(process.env.NEXT_PUBLIC_BARIKOI_API_KEY),
      modelUpstream: process.env.MODEL_UPSTREAM_URL ?? "(default: raw.githubusercontent.com)",
    })
  );
}
