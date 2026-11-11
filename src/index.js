// sched-prod API: the incidents the status page and the board read. Contract: contract/api.md.

const json = (body, status = 200) => Response.json(body, { status });

async function feed(env) {
  const res = await fetch(env.FEED_URL);
  if (!res.ok) throw new Error(`feed answered ${res.status}`);
  const { incidents } = await res.json();
  return withSuggestions(incidents);
}

// Decision 0008, option 2: one read-only line, on the oldest open incident (where operators start),
// only when sure: another open incident shares its service. Never advice, never a restart.
function withSuggestions(incidents) {
  const open = incidents.filter((i) => i.status === 'open');
  const top = open.reduce((a, i) => (!a || Date.parse(i.openedAt) < Date.parse(a.openedAt) ? i : a), null);
  const same = top ? open.filter((i) => i.service === top.service && i !== top).length : 0;
  return incidents.map((i) => ({
    ...i,
    suggestions: i === top && same ? [{ text: `Start here: ${same} other open incident${same > 1 ? 's' : ''} on ${top.service}.` }] : [],
  }));
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
