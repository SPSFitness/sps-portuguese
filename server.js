const express = require('express');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');
const { schedule } = require('./lib/srs');
const {
  exercisePrompt, gradePrompt, assessmentPrompt, EP_LOCK, stateBlock
} = require('./lib/prompts');

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('render.com') ? { rejectUnauthorized: false } : false
});

pool.on('connect', c => c.query('set search_path to pt, public'));

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';
const CHEAP_MODEL = process.env.ANTHROPIC_CHEAP_MODEL || 'claude-haiku-4-5-20251001';
const USER_ID = Number(process.env.APP_USER_ID || 1);

// --- simple single user gate, same pattern as the Styku app -----------------
const tokens = new Set();
function auth(req, res, next) {
  if (!process.env.APP_PASSWORD) return next();
  const t = (req.headers.authorization || '').replace('Bearer ', '');
  if (tokens.has(t)) return next();
  return res.status(401).json({ error: 'Not signed in' });
}
app.post('/api/login', (req, res) => {
  if (!process.env.APP_PASSWORD) return res.json({ token: 'open' });
  if (req.body.password !== process.env.APP_PASSWORD) {
    return res.status(401).json({ error: 'Wrong password' });
  }
  const t = crypto.randomBytes(24).toString('hex');
  tokens.add(t);
  res.json({ token: t });
});

// --- Claude ----------------------------------------------------------------
async function claude(prompt, { model = MODEL, maxTokens = 1600, system } = {}) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      ...(system ? { system } : {}),
      messages: [{ role: 'user', content: prompt }]
    })
  });
  if (!r.ok) { const errText = await r.text(); console.error("CLAUDE ERROR", r.status, errText); throw new Error(`Claude ${r.status}: ${errText}`); }
  const data = await r.json();
  return data.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
}

function parseJson(text) {
  const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON in model reply');
  return JSON.parse(clean.slice(start, end + 1));
}

// --- learner state ---------------------------------------------------------
async function loadState() {
  const user = (await pool.query('select * from users where id=$1', [USER_ID])).rows[0];
  if (!user) throw new Error('No user row. Insert one into users first.');

  const [count, recent, weak, errs, due] = await Promise.all([
    pool.query('select count(*)::int c from user_vocab where user_id=$1', [USER_ID]),
    pool.query(`select v.pt from user_vocab uv join vocab v on v.id=uv.vocab_id
                where uv.user_id=$1 order by uv.last_seen desc nulls last limit 15`, [USER_ID]),
    pool.query(`select v.pt, uv.lapses from user_vocab uv join vocab v on v.id=uv.vocab_id
                where uv.user_id=$1 and uv.lapses > 1 order by uv.lapses desc limit 10`, [USER_ID]),
    pool.query(`select category, count(*)::int count from error_log
                where user_id=$1 and created_at > now() - interval '30 days'
                group by category order by count desc limit 8`, [USER_ID]),
    pool.query(`select count(*)::int c from user_vocab where user_id=$1 and due_at <= now()`, [USER_ID])
  ]);

  return {
    ...user,
    vocabCount: count.rows[0].c,
    recentVocab: recent.rows,
    weakVocab: weak.rows,
    errorCategories: errs.rows,
    dueCount: due.rows[0].c
  };
}

app.get('/api/state', auth, async (req, res) => {
  try { res.json(await loadState()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// --- review queue ----------------------------------------------------------
app.get('/api/review/due', auth, async (req, res) => {
  const limit = Math.min(Number(req.query.limit || 20), 50);
  try {
    let { rows } = await pool.query(
      `select v.*, uv.ease, uv.interval_days, uv.repetitions, uv.lapses
       from user_vocab uv join vocab v on v.id=uv.vocab_id
       where uv.user_id=$1 and uv.due_at <= now()
       order by uv.due_at limit $2`, [USER_ID, limit]);

    // Top up with new words at or below the working level.
    if (rows.length < limit) {
      const fresh = await pool.query(
        `select v.* from vocab v
         where v.id not in (select vocab_id from user_vocab where user_id=$1)
         order by case v.cefr when 'A1' then 1 when 'A2' then 2 when 'B1' then 3
                              when 'B2' then 4 else 5 end, random()
         limit $2`, [USER_ID, limit - rows.length]);
      rows = rows.concat(fresh.rows.map(r => ({ ...r, isNew: true })));
    }
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/review/grade', auth, async (req, res) => {
  const { vocab_id, quality } = req.body;
  try {
    const existing = (await pool.query(
      'select * from user_vocab where user_id=$1 and vocab_id=$2', [USER_ID, vocab_id])).rows[0];
    const next = schedule(existing || {}, Number(quality));
    await pool.query(
      `insert into user_vocab (user_id, vocab_id, ease, interval_days, repetitions, lapses,
                               due_at, last_quality, last_seen)
       values ($1,$2,$3,$4,$5,$6,$7,$8, now())
       on conflict (user_id, vocab_id) do update set
         ease=$3, interval_days=$4, repetitions=$5, lapses=$6,
         due_at=$7, last_quality=$8, last_seen=now()`,
      [USER_ID, vocab_id, next.ease, next.interval_days, next.repetitions,
       next.lapses, next.due_at, quality]);
    res.json(next);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- exercise generation ---------------------------------------------------
app.post('/api/exercise', auth, async (req, res) => {
  const mode = req.body.mode || 'vocab';
  try {
    const state = await loadState();
    const text = await claude(exercisePrompt(mode, state), {
      model: mode === 'vocab' ? CHEAP_MODEL : MODEL
    });
    res.json(parseJson(text));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- grading, isolated from teaching --------------------------------------
app.post('/api/grade', auth, async (req, res) => {
  const { mode, task, response: learnerResponse } = req.body;
  try {
    const state = await loadState();
    const text = await claude(gradePrompt({
      level: state.level, mode, task, learnerResponse
    }), { maxTokens: 1200 });
    const result = parseJson(text);

    for (const err of result.errors || []) {
      await pool.query(
        `insert into error_log (user_id, category, skill, learner_text, correction, explanation)
         values ($1,$2,$3,$4,$5,$6)`,
        [USER_ID, err.category, mode, err.learner_text, err.correction, err.explanation]);
    }
    await pool.query(
      `insert into sessions (user_id, mode, items_attempted, items_correct)
       values ($1,$2,1,$3)`, [USER_ID, mode, result.correct ? 1 : 0]);

    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- conversation ----------------------------------------------------------
app.post('/api/converse', auth, async (req, res) => {
  const { message } = req.body;
  try {
    const state = await loadState();
    const history = (await pool.query(
      `select role, content from turns where user_id=$1 order by created_at desc limit 20`,
      [USER_ID])).rows.reverse();

    const convo = history.map(t => `${t.role}: ${t.content}`).join('\n');
    const prompt = `${EP_LOCK}

${stateBlock(state)}

Recent conversation:
${convo || '(new conversation)'}

The learner just said: ${message}

Reply naturally in European Portuguese at their level. If they made a mistake, correct it
briefly in English at the end under the heading Correcção, then carry on the conversation.
Keep your Portuguese to three sentences or fewer.`;

    const reply = await claude(prompt, { maxTokens: 800 });
    await pool.query(`insert into turns (user_id, role, content) values ($1,'user',$2),($1,'assistant',$3)`,
      [USER_ID, message, reply]);
    res.json({ reply });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- level gate ------------------------------------------------------------
const LADDER = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

app.post('/api/assess', auth, async (req, res) => {
  const { level, transcript } = req.body;
  try {
    const text = await claude(assessmentPrompt(level, transcript), { maxTokens: 1200 });
    const result = parseJson(text);
    await pool.query(
      `insert into assessments (user_id, level_tested, passed, overall, detail)
       values ($1,$2,$3,$4,$5)`,
      [USER_ID, level, !!result.passed, result.overall || 0, result]);

    if (result.passed) {
      const next = LADDER[Math.min(LADDER.indexOf(level) + 1, LADDER.length - 1)];
      await pool.query('update users set level=$1 where id=$2', [next, USER_ID]);
      result.new_level = next;
    }
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- stats for the dashboard ----------------------------------------------
app.get('/api/stats', auth, async (req, res) => {
  try {
    const [strength, errors, activity] = await Promise.all([
      pool.query(`select
          count(*) filter (where interval_days = 0)::int as new,
          count(*) filter (where interval_days between 1 and 6)::int as learning,
          count(*) filter (where interval_days between 7 and 29)::int as familiar,
          count(*) filter (where interval_days >= 30)::int as solid
        from user_vocab where user_id=$1`, [USER_ID]),
      pool.query(`select category, count(*)::int c from error_log
                  where user_id=$1 and created_at > now() - interval '60 days'
                  group by category order by c desc limit 8`, [USER_ID]),
      pool.query(`select created_at::date d, sum(items_attempted)::int n from sessions
                  where user_id=$1 and created_at > now() - interval '30 days'
                  group by d order by d`, [USER_ID])
    ]);
    res.json({ strength: strength.rows[0], errors: errors.rows, activity: activity.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/healthz', (req, res) => res.send('ok'));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Tutor listening on ${port}`));
