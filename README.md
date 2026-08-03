# Português: European Portuguese tutor

A tutor that remembers. Node/Express plus Postgres on Render, same shape as sps-finance.
The point of the architecture is the state model: level, vocabulary strength, categorised
error history and review schedule are injected into every model call, so it teaches the
person it has actually been teaching.

## Deploy

1. Create a Postgres instance on Render, copy the internal connection string.
2. `psql $DATABASE_URL -f db/schema.sql` then `psql $DATABASE_URL -f db/seed.sql`
3. Insert yourself: `insert into users (email, name, level, target_level) values ('you@spsfitness.co.uk','Sam','A0','C1');`
4. New Render web service from the repo. Build `npm install`, start `npm start`.
5. Set the env vars from `.env.example`.

## How the pieces fit

**Teaching and marking are separate calls.** `/api/exercise` has your full history and is
warm. `/api/grade` has no history, no rapport and an explicit error taxonomy. That split
exists because a model that has been chatting with you encouragingly will mark you
generously, and generous marking is how you end up a confident fake B2.

**The level gate is the only thing that changes your level.** Practice does not promote
you. `/api/assess` requires every CEFR criterion at 75 or above, including
`ep_authenticity`, which measures whether your Portuguese reads as Portugal rather than
Brazil or textbook. Expect to fail it repeatedly.

**The sound stripe.** Every word carries a plain English respelling under it, because
European Portuguese spelling hides the pronunciation. `pequeno-almoço` is `p'KEH-nu al-MO-su`
and nothing about the written form tells you that.

**Error log drives content.** Every correction is categorised and counted. The exercise
generator is told your top categories and leans on them.

## The EP lock

`lib/prompts.js` holds the anchor prompt. Models drift back to Brazilian forms over long
contexts, so it is repeated on every single call rather than set once. It covers `estar a`
plus infinitive, tu conjugation from day one, clitic placement rules, Portuguese numerals,
and the vocabulary split. This is the file to iterate on. Spot check the output monthly.

## What this cannot do

- **Grade your accent.** Web Speech transcribes what it thinks you said, then the model
  marks the text. Good enough for grammar and word choice under time pressure, useless for
  vowel reduction. That is the main thing you will get wrong and the app will not catch it.
- **Be trusted above B2.** European Portuguese C1 and C2 material is thin compared to
  Brazilian, and by then you cannot audit its judgements. Book a native EP tutor from B2,
  fortnightly, purely as a calibration check on what this thing has been telling you.
- **Replace listening at native speed.** Feed it real audio transcripts from RTP or Antena 1
  rather than relying on synthesised speech, which is far too clear.

## Known rough edges

- Browser text to speech pt-PT voice quality varies a lot. iOS has a decent one, Android and
  desktop Chrome are patchy. If it grates, swap `speak()` for an ElevenLabs or Azure call and
  cache the audio against the vocab row.
- `vocab.image_url` exists in the schema but nothing populates it yet. Pexels or Unsplash
  keyed on the English word, cached once per row, is the cheap route. Picture to word beats
  English to word because it skips the translation step.
- Sessions and streak are recorded but `users.streak_days` is never incremented. Add it to
  `/api/grade` when you wire up daily use.
- Auth tokens live in memory, so a Render restart signs you out. Fine for one user.

## Untested

Written without a live database or API key to hand. Syntax checks pass and the scheduler is
verified, but the SQL and the round trips have not been run against a real instance.
