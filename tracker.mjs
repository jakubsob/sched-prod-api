// Tracker CLI for the agent: node tracker.mjs METHOD /path ['{"json":"body"}']  — token comes from env, never from argv.
const [method, path, body] = process.argv.slice(2);
const r = await fetch(process.env.TRACKER_URL + path, {
  method,
  headers: { Authorization: `Bearer ${process.env.TRACKER_TOKEN}`, 'content-type': 'application/json' },
  body: body || undefined,
  signal: AbortSignal.timeout(30_000),
});
console.log(r.status, await r.text());
