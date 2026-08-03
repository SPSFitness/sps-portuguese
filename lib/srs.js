// SM-2 scheduler. quality is 0 to 5, where 3 is the pass threshold.
// 5 instant and correct, 4 correct after thought, 3 correct but hard,
// 2 wrong but recognised, 1 wrong, 0 no idea.

const DAY = 86400000;

function schedule(state, quality) {
  let ease = Number(state.ease ?? 2.5);
  let interval = Number(state.interval_days ?? 0);
  let reps = Number(state.repetitions ?? 0);
  let lapses = Number(state.lapses ?? 0);

  if (quality < 3) {
    reps = 0;
    interval = 1;
    lapses += 1;
  } else {
    reps += 1;
    if (reps === 1) interval = 1;
    else if (reps === 2) interval = 6;
    else interval = Math.round(interval * ease);
  }

  ease = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ease < 1.3) ease = 1.3;

  // A word you keep dropping should not drift out to a month.
  if (lapses >= 4) interval = Math.min(interval, 7);

  return {
    ease: Number(ease.toFixed(2)),
    interval_days: interval,
    repetitions: reps,
    lapses,
    due_at: new Date(Date.now() + interval * DAY)
  };
}

// Rough strength for the dashboard, 0 to 1.
function strength(row) {
  const i = Number(row.interval_days || 0);
  return Math.min(1, Math.log2(i + 1) / Math.log2(181));
}

module.exports = { schedule, strength };
