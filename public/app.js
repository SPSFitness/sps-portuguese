const LADDER = ['A0','A1','A2','B1','B2','C1','C2'];
let token = localStorage.getItem('pt_token');
let state = null;
let charts = [];

const $ = s => document.querySelector(s);
const stage = () => $('#stage');

// ---------------------------------------------------------------- api
async function api(path, opts = {}) {
  const r = await fetch('/api' + path, {
    ...opts,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: 'Bearer ' + token } : {}),
      ...(opts.headers || {})
    }
  });
  if (r.status === 401) { signOut(); throw new Error('Session expired'); }
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function signOut() {
  localStorage.removeItem('pt_token');
  token = null;
  $('#app').hidden = true;
  $('#gate').style.display = 'grid';
}

$('#signin').onclick = async () => {
  const err = $('#gate-error');
  err.hidden = true;
  try {
    const r = await fetch('/api/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: $('#password').value })
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error);
    token = d.token;
    localStorage.setItem('pt_token', token);
    start();
  } catch (e) { err.textContent = e.message; err.hidden = false; }
};
$('#password').onkeydown = e => { if (e.key === 'Enter') $('#signin').click(); };

// ---------------------------------------------------------------- speech
let voice = null;
function pickVoice() {
  const vs = speechSynthesis.getVoices();
  voice = vs.find(v => v.lang === 'pt-PT')
       || vs.find(v => v.lang && v.lang.startsWith('pt-PT'))
       || vs.find(v => v.lang && v.lang.startsWith('pt'))
       || null;
}
speechSynthesis.onvoiceschanged = pickVoice;
pickVoice();

function speak(text, rate = 0.9) {
  if (!text) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'pt-PT';
  u.rate = rate;
  if (voice) u.voice = voice;
  speechSynthesis.speak(u);
}

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
function record(onResult, button) {
  if (!SR) { alert('This browser cannot record speech. Chrome or Safari will.'); return; }
  const rec = new SR();
  rec.lang = 'pt-PT';
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  button.classList.add('live');
  button.textContent = 'A ouvir, fale agora';
  rec.onresult = e => onResult(e.results[0][0].transcript);
  rec.onerror = () => onResult(null);
  rec.onend = () => { button.classList.remove('live'); button.textContent = 'Record answer'; };
  rec.start();
}

// ---------------------------------------------------------------- shell
function renderLadder() {
  const nowIdx = LADDER.indexOf(state.level);
  const targetIdx = LADDER.indexOf(state.target_level);
  $('#ladder').innerHTML = LADDER.map((l, i) => {
    const cls = [i < nowIdx ? 'done' : '', i === nowIdx ? 'now' : '', i === targetIdx ? 'target' : ''].join(' ');
    return `<li class="${cls}"><span class="rung"></span>${l}</li>`;
  }).join('');
  $('#level-now').textContent = state.level;
  $('#due-badge').textContent = state.dueCount || '';
}

document.querySelectorAll('#modes button').forEach(b => {
  b.onclick = () => {
    document.querySelectorAll('#modes button').forEach(x => x.classList.remove('is-on'));
    b.classList.add('is-on');
    open(b.dataset.mode);
  };
});

async function open(mode) {
  charts.forEach(c => c.destroy()); charts = [];
  stage().innerHTML = '<div class="loading">A carregar</div>';
  try {
    if (mode === 'dashboard') return dashboard();
    if (mode === 'review') return review();
    if (mode === 'assess') return assess();
    if (mode === 'converse') return converse();
    return exercise(mode);
  } catch (e) {
    stage().innerHTML = `<div class="card"><p class="error-line">${e.message}</p>
      <div class="row"><button class="btn" onclick="location.reload()">Reload</button></div></div>`;
  }
}

// ---------------------------------------------------------------- dashboard
async function dashboard() {
  const s = await api('/stats');
  const weak = state.errorCategories[0];
  stage().innerHTML = `
    <p class="eyebrow">Hoje</p>
    <h2>${state.dueCount} to review</h2>
    <p class="lede">${weak
      ? `Your most frequent slip in the last month is <strong>${weak.category.replace(/_/g,' ')}</strong>, ${weak.count} times. Exercises will lean on it.`
      : 'Nothing logged yet. Start with Sound, then Review.'}</p>

    <div class="tiles">
      <div class="tile"><span class="n">${state.vocabCount}</span><span class="l">Words seen</span></div>
      <div class="tile"><span class="n">${s.strength.solid || 0}</span><span class="l">Solid</span></div>
      <div class="tile"><span class="n">${state.streak_days || 0}</span><span class="l">Day streak</span></div>
      <div class="tile"><span class="n">${state.level}</span><span class="l">Working level</span></div>
    </div>

    <div class="chart-wrap"><h3>Vocabulary strength</h3><canvas id="c1" height="150"></canvas></div>
    <div class="chart-wrap"><h3>Errors by category, 60 days</h3><canvas id="c2" height="180"></canvas></div>
    <div class="chart-wrap"><h3>Items attempted, 30 days</h3><canvas id="c3" height="150"></canvas></div>`;

  const grid = { grid: { color: '#DCE4EB' }, ticks: { color: '#4A5764', font: { family: 'IBM Plex Mono', size: 10 } } };
  const base = { plugins: { legend: { display: false } }, scales: { x: grid, y: { ...grid, beginAtZero: true } } };

  charts.push(new Chart($('#c1'), {
    type: 'bar',
    data: {
      labels: ['New', 'Learning', 'Familiar', 'Solid'],
      datasets: [{ data: [s.strength.new, s.strength.learning, s.strength.familiar, s.strength.solid],
        backgroundColor: ['#DCE4EB', '#2C6BB5', '#16386E', '#4E7A62'] }]
    }, options: base
  }));

  charts.push(new Chart($('#c2'), {
    type: 'bar',
    data: {
      labels: s.errors.map(e => e.category.replace(/_/g, ' ')),
      datasets: [{ data: s.errors.map(e => e.c), backgroundColor: '#8E2A3B' }]
    }, options: { ...base, indexAxis: 'y' }
  }));

  charts.push(new Chart($('#c3'), {
    type: 'line',
    data: {
      labels: s.activity.map(a => new Date(a.d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })),
      datasets: [{ data: s.activity.map(a => a.n), borderColor: '#16386E', backgroundColor: '#16386E', tension: 0.3, pointRadius: 2 }]
    }, options: base
  }));
}

// ---------------------------------------------------------------- review
async function review() {
  const queue = await api('/review/due?limit=20');
  if (!queue.length) {
    stage().innerHTML = `<p class="eyebrow">Revisão</p><h2>Nothing due</h2>
      <p class="lede">Come back later, or take a Listen or Write session instead.</p>`;
    return;
  }
  let i = 0;
  const card = () => {
    const v = queue[i];
    if (!v) { open('review'); return; }
    stage().innerHTML = `
      <p class="eyebrow">Revisão &nbsp;${i + 1} / ${queue.length}${v.isNew ? ' &nbsp;· palavra nova' : ''}</p>
      <div class="card">
        <div class="word">
          <span class="pt">${v.pt}</span>
          ${v.phonetic ? `<span class="stripe">${v.phonetic}</span>` : ''}
          <span class="en" id="meaning" style="visibility:hidden">${v.en}${v.gender ? ` · ${v.gender}` : ''}</span>
        </div>
        <div id="detail" hidden>
          ${v.example_pt ? `<p class="pt-body">${v.example_pt}</p><p class="note">${v.example_en}</p>` : ''}
          ${v.br_warning ? `<p class="warn">${v.br_warning}</p>` : ''}
        </div>
        <div class="row">
          <button class="btn" id="hear">Hear it</button>
          <button class="btn solid" id="show">Show meaning</button>
        </div>
        <div class="row" id="grades" hidden>
          <button class="btn" data-q="1">No idea</button>
          <button class="btn" data-q="3">Hard</button>
          <button class="btn" data-q="4">Good</button>
          <button class="btn solid" data-q="5">Easy</button>
        </div>
      </div>`;
    $('#hear').onclick = () => speak(v.example_pt || v.pt);
    $('#show').onclick = () => {
      $('#meaning').style.visibility = 'visible';
      $('#detail').hidden = false;
      $('#grades').hidden = false;
      $('#show').hidden = true;
    };
    document.querySelectorAll('#grades button').forEach(b => {
      b.onclick = async () => {
        await api('/review/grade', { method: 'POST', body: JSON.stringify({ vocab_id: v.id, quality: Number(b.dataset.q) }) });
        i++;
        if (i >= queue.length) { state = await api('/state'); renderLadder(); open('dashboard'); }
        else card();
      };
    });
  };
  card();
}

// ---------------------------------------------------------------- exercises
async function exercise(mode) {
  const ex = await api('/exercise', { method: 'POST', body: JSON.stringify({ mode }) });
  const needsAnswer = ['speak', 'write', 'listen'].includes(mode);

  stage().innerHTML = `
    <p class="eyebrow">${mode}</p>
    <h2>${ex.title}</h2>
    <p class="lede">${ex.prompt_en}</p>

    <div class="card">
      ${ex.content_pt ? `<p class="pt-body">${mode === 'listen' ? '' : ex.content_pt}</p>` : ''}
      ${ex.phonetic && mode !== 'listen' ? `<div class="word"><span class="stripe">${ex.phonetic}</span></div>` : ''}
      ${(ex.questions || []).length ? `<ol class="pt-body">${ex.questions.map(q => `<li>${q}</li>`).join('')}</ol>` : ''}
      <div class="row">
        ${ex.speak_aloud || ex.content_pt ? `<button class="btn" id="hear">Play</button>
          <button class="btn ghost" id="slow">Play slowly</button>` : ''}
        ${mode === 'listen' ? `<button class="btn ghost" id="reveal">Show transcript</button>` : ''}
      </div>
      <div id="transcript" hidden><p class="note">${ex.content_pt || ''}</p></div>
      ${ex.teaching_note ? `<p class="note">${ex.teaching_note}</p>` : ''}
    </div>

    ${needsAnswer ? `
    <div class="card">
      <p class="eyebrow">A sua resposta</p>
      <textarea id="answer" placeholder="${mode === 'speak' ? 'Record, or type what you said' : 'Escreva em português'}"></textarea>
      <div class="row">
        ${mode === 'speak' ? `<button class="btn rec" id="rec">Record answer</button>` : ''}
        <button class="btn solid" id="submit">Mark it</button>
      </div>
    </div>` : `
    <div class="row"><button class="btn solid" id="next">Next</button></div>`}

    <div id="result"></div>`;

  const audio = ex.speak_aloud || ex.content_pt;
  if ($('#hear')) $('#hear').onclick = () => speak(audio);
  if ($('#slow')) $('#slow').onclick = () => speak(audio, 0.65);
  if ($('#reveal')) $('#reveal').onclick = () => { $('#transcript').hidden = false; };
  if ($('#next')) $('#next').onclick = () => open(mode);
  if ($('#rec')) $('#rec').onclick = e => record(t => { if (t) $('#answer').value = t; }, e.target);

  if ($('#submit')) $('#submit').onclick = async () => {
    const answer = $('#answer').value.trim();
    if (!answer) return;
    $('#result').innerHTML = '<div class="loading">A corrigir</div>';
    const g = await api('/grade', {
      method: 'POST',
      body: JSON.stringify({ mode, task: `${ex.prompt_en} ${ex.content_pt || ''}`, response: answer })
    });
    renderGrade(g, ex, mode);
  };
}

function renderGrade(g, ex, mode) {
  $('#result').innerHTML = `
    <div class="card">
      <div class="verdict ${g.correct ? 'pass' : 'fail'}">
        <span class="score">${g.score}</span>
        <span>${g.correct ? 'Aceite' : 'Não está certo'}</span>
      </div>
      ${g.corrected_pt ? `<p class="pt-body">${g.corrected_pt}</p>
        <div class="row"><button class="btn" id="hearfix">Hear the correction</button></div>` : ''}
      ${(g.errors || []).map(e => `
        <div class="err">
          <div class="cat">${e.category.replace(/_/g, ' ')}</div>
          <p><span class="was">${e.learner_text}</span> &nbsp;<span class="fix">${e.correction}</span></p>
          <p class="note">${e.explanation}</p>
        </div>`).join('')}
      ${g.natural_alternative ? `<p class="note">More natural in Portugal: ${g.natural_alternative}</p>` : ''}
      ${ex.model_answer ? `<div class="err"><div class="cat">Model answer</div><p class="pt-body">${ex.model_answer}</p></div>` : ''}
      <div class="row"><button class="btn solid" id="again">Next exercise</button></div>
    </div>`;
  if ($('#hearfix')) $('#hearfix').onclick = () => speak(g.corrected_pt);
  $('#again').onclick = () => open(mode);
}

// ---------------------------------------------------------------- converse
async function converse() {
  stage().innerHTML = `
    <p class="eyebrow">Conversa</p>
    <h2>Talk to it</h2>
    <p class="lede">European Portuguese at your level. Corrections come after the reply, not instead of it.</p>
    <div id="thread"></div>
    <div class="card">
      <textarea id="msg" placeholder="Escreva ou grave"></textarea>
      <div class="row">
        <button class="btn rec" id="rec">Record answer</button>
        <button class="btn solid" id="send">Send</button>
      </div>
    </div>`;

  $('#rec').onclick = e => record(t => { if (t) $('#msg').value = t; }, e.target);
  $('#send').onclick = async () => {
    const message = $('#msg').value.trim();
    if (!message) return;
    $('#msg').value = '';
    $('#thread').insertAdjacentHTML('beforeend',
      `<div class="card"><p class="eyebrow">Você</p><p>${message}</p></div>
       <div class="card" id="pending"><div class="loading">A pensar</div></div>`);
    const { reply } = await api('/converse', { method: 'POST', body: JSON.stringify({ message }) });
    const pt = reply.split(/Correc[çc][ãa]o/i)[0].trim();
    $('#pending').outerHTML = `<div class="card">
      <p class="eyebrow">Tutor</p>
      <p class="pt-body">${reply.replace(/\n/g, '<br>')}</p>
      <div class="row"><button class="btn" onclick="window.__say(${JSON.stringify(pt).replace(/"/g, '&quot;')})">Hear it</button></div>
    </div>`;
    window.scrollTo(0, document.body.scrollHeight);
  };
}
window.__say = speak;

// ---------------------------------------------------------------- level gate
async function assess() {
  const target = LADDER[Math.min(LADDER.indexOf(state.level) + 1, LADDER.length - 1)];
  stage().innerHTML = `
    <p class="eyebrow">Exame</p>
    <h2>Gate to ${target}</h2>
    <p class="lede">This is marked cold, with no memory of your practice and no credit for effort.
    Every criterion must clear 75. Failing is the normal outcome until you are genuinely there,
    and that is the point: it is the only thing that moves your level.</p>
    <div class="card">
      <p class="eyebrow">Write in Portuguese, 150 words or more</p>
      <p>Describe your week, argue a position you hold, and explain something you would say to a
      builder or an official. Use past, present and future.</p>
      <textarea id="script" style="min-height:260px"></textarea>
      <div class="row">
        <button class="btn rec" id="rec">Record instead</button>
        <button class="btn solid" id="sit">Submit for marking</button>
      </div>
    </div>
    <div id="result"></div>`;

  $('#rec').onclick = e => record(t => { if (t) $('#script').value += ' ' + t; }, e.target);
  $('#sit').onclick = async () => {
    const transcript = $('#script').value.trim();
    if (transcript.length < 120) { alert('Too short to mark fairly. Write more.'); return; }
    $('#result').innerHTML = '<div class="loading">A avaliar</div>';
    const r = await api('/assess', { method: 'POST', body: JSON.stringify({ level: target, transcript }) });
    $('#result').innerHTML = `
      <div class="card">
        <div class="verdict ${r.passed ? 'pass' : 'fail'}">
          <span class="score">${Math.round(r.overall)}</span>
          <span>${r.passed ? `Passed. Now working at ${r.new_level}.` : 'Not yet'}</span>
        </div>
        <p>${r.verdict}</p>
        ${Object.entries(r.scores || {}).map(([k, v]) =>
          `<div class="err"><div class="cat">${k.replace(/_/g, ' ')}</div><p>${v} / 100</p></div>`).join('')}
        ${(r.blocking_weaknesses || []).length
          ? `<p class="warn">Blocking: ${r.blocking_weaknesses.join('. ')}</p>` : ''}
      </div>`;
    state = await api('/state');
    renderLadder();
  };
}

// ---------------------------------------------------------------- boot
async function start() {
  try {
    state = await api('/state');
    $('#gate').style.display = 'none';
    $('#app').hidden = false;
    renderLadder();
    open('dashboard');
  } catch (e) {
    if (e.message !== 'Session expired') {
      $('#gate-error').textContent = e.message;
      $('#gate-error').hidden = false;
    }
  }
}
if (token) start();
