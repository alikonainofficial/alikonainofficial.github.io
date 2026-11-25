/**
 * Fetches Ali's LeetCode practice into src/data/leetcode.json, the snapshot the
 * rehearsal log is built from. Runs in CI once a day, before the build.
 *
 * LeetCode's public GraphQL endpoint sends no CORS headers, so the browser can
 * never ask it directly; fetching at build time keeps the site free of
 * third-party requests anyway. If the fetch fails or the answer looks wrong,
 * the last committed snapshot stays in place and the build carries on.
 *
 * Only totals and the activity calendar are kept: which problems were solved,
 * and when, stays on LeetCode.
 *
 *   node scripts/fetch-leetcode.mjs [username]
 */
import { readFile, writeFile } from 'node:fs/promises';

const USERNAME = process.argv[2] ?? 'alikonain';
const OUT = new URL('../src/data/leetcode.json', import.meta.url);

const QUERY = `query rehearsal($u: String!) {
  matchedUser(username: $u) {
    username
    submitStatsGlobal { acSubmissionNum { difficulty count } }
    userCalendar { submissionCalendar }
  }
}`;

async function fetchOnce() {
  const res = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Referer: 'https://leetcode.com',
      'User-Agent': 'Mozilla/5.0 (portfolio build; +https://alikonainofficial.github.io)',
    },
    body: JSON.stringify({ query: QUERY, variables: { u: USERNAME } }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`LeetCode answered ${res.status}`);
  const body = await res.json();
  if (body.errors?.length) throw new Error(body.errors.map((e) => e.message).join('; '));
  return body.data;
}

async function fetchWithRetries(tries = 3) {
  for (let i = 1; ; i++) {
    try {
      return await fetchOnce();
    } catch (err) {
      if (i >= tries) throw err;
      await new Promise((r) => setTimeout(r, 2000 * i));
    }
  }
}

function shape(data) {
  const user = data?.matchedUser;
  if (!user) throw new Error(`No LeetCode user called ${USERNAME}`);
  const solved = Object.fromEntries(user.submitStatsGlobal.acSubmissionNum.map((d) => [d.difficulty.toLowerCase(), d.count]));
  const calendar = JSON.parse(user.userCalendar?.submissionCalendar || '{}');

  return {
    username: user.username,
    fetchedAt: new Date().toISOString(),
    solved: { all: solved.all ?? 0, easy: solved.easy ?? 0, medium: solved.medium ?? 0, hard: solved.hard ?? 0 },
    calendar,
  };
}

let previous;
try {
  previous = JSON.parse(await readFile(OUT, 'utf8'));
} catch {
  previous = undefined;
}

try {
  const next = shape(await fetchWithRetries());
  // A sudden drop usually means a bad answer rather than unsolved problems: keep the old snapshot.
  if (previous && next.solved.all < previous.solved.all) throw new Error(`Solved count fell from ${previous.solved.all} to ${next.solved.all}`);
  await writeFile(OUT, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`LeetCode: ${next.solved.all} solved, ${Object.keys(next.calendar).length} active days on record.`);
} catch (err) {
  console.warn(`::warning::LeetCode fetch skipped, keeping the last snapshot: ${err.message}`);
}
