// Runs forever: every 30s read the tracker; when something needs the agent, run `claude -p` with the triage skill.
// Needs TRACKER_URL, TRACKER_TOKEN (from .round.env, git-ignored). Run: node --env-file=.round.env agent-loop.mjs
import { spawnSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';

const { TRACKER_URL, TRACKER_TOKEN } = process.env;
const log = (o) => appendFileSync('agent-loop.log', JSON.stringify({ t: new Date().toISOString(), ...o }) + '\n');
const get = async (p) => (await fetch(TRACKER_URL + p, { headers: { Authorization: `Bearer ${TRACKER_TOKEN}` }, signal: AbortSignal.timeout(20_000) })).json();

// Work to do = an open issue with no agent entry yet, or a non-agent entry (owner/course) newer than the agent's last one.
export function pending(issues) {
  return issues.filter((i) => {
    if (i.closed) return false;
    const last = (k) => i.thread.filter((e) => k(e.by)).at(-1)?.at ?? '';
    const agent = last((b) => b === 'agent');
    return !agent || last((b) => b !== 'agent') > agent;
  }).map((i) => i.n);
}

// Narrow allowlist: files in this repo, the tracker, git, node/npm, and wrangler deploy. No other shell.
const ALLOWED = ['Read', 'Edit', 'Write', 'Bash(curl:*)', 'Bash(git:*)', 'Bash(node:*)', 'Bash(npm run deploy:*)', 'Bash(npx wrangler deploy:*)', 'Bash(ls:*)', 'Bash(cat:*)'];

if (process.argv[1] === new URL(import.meta.url).pathname) {
  while (true) {
    try {
      const { issues } = await get('/issues');
      const todo = pending(issues);
      if (todo.length) {
        log({ ev: 'run', todo });
        const prompt = `Load the triage skill (.agents/skills/triage/SKILL.md) and AGENTS.md. Work these issues now: ${todo.join(', ')}. Tracker: ${TRACKER_URL} (token in env TRACKER_TOKEN; never print it). Live address is in .live-url. Finish every step, then stop.`;
        const r = spawnSync('claude', ['-p', prompt, '--allowedTools', ...ALLOWED], { encoding: 'utf8', timeout: 20 * 60_000, env: process.env });
        log({ ev: 'done', status: r.status, out: String(r.stdout).slice(-1500), err: String(r.stderr).slice(-500) });
      }
    } catch (e) { log({ ev: 'error', msg: e.message }); }
    await new Promise((r) => setTimeout(r, 30_000));
  }
}
