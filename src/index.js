// sched-prod API: the incidents the status page and the board read. Contract: contract/api.md.

const json = (body, status = 200) => Response.json(body, { status });

async function feed(env) {
  const res = await fetch(env.FEED_URL);
  if (!res.ok) throw new Error(`feed answered ${res.status}`);
  const { incidents } = await res.json();
  return incidents;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/incidents') {
      const status = url.searchParams.get('status');
      const since = url.searchParams.get('since');
      const sinceMs = since === null ? null : Date.parse(since);
      if ((status !== null && !['open', 'resolved'].includes(status)) || Number.isNaN(sinceMs)) {
        return json({ error: 'bad query' }, 400);
      }
      let incidents = await feed(env);
      if (status) incidents = incidents.filter((i) => i.status === status);
      if (sinceMs !== null) incidents = incidents.filter((i) => Date.parse(i.openedAt) > sinceMs);
      return json({ incidents });
    }
    const m = request.method === 'GET' && url.pathname.match(/^\/incidents\/([^/]+)$/);
    if (m) {
      let id;
      try { id = decodeURIComponent(m[1]); } catch { return json({ error: 'not found' }, 404); }
      const incident = (await feed(env)).find((i) => i.id === id);
      if (incident) return json({ incident });
    }
    return json({ error: 'not found' }, 404);
  },
};
