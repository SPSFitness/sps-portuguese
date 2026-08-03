-- European Portuguese tutor: state model
-- Run once against your Render Postgres instance.

create table if not exists users (
  id            serial primary key,
  email         text unique not null,
  name          text,
  level         text not null default 'A0',      -- current working level
  target_level  text not null default 'C1',
  streak_days   int  not null default 0,
  last_active   date,
  created_at    timestamptz default now()
);

-- Master vocabulary. Shared across users so images and audio are cached once.
create table if not exists vocab (
  id          serial primary key,
  pt          text not null,          -- European Portuguese form
  en          text not null,
  pos         text,                   -- noun, verb, adj, adv, phrase
  gender      text,                   -- m, f, or null
  plural      text,
  phonetic    text,                   -- reduced-vowel respelling, the EP sound stripe
  cefr        text not null default 'A1',
  topic       text,                   -- daily, gym, football, admin, property, retreat
  image_url   text,
  example_pt  text,
  example_en  text,
  br_warning  text,                   -- the Brazilian form to avoid, if any
  created_at  timestamptz default now(),
  unique (pt, en)
);

-- Per user spaced repetition state (SM-2).
create table if not exists user_vocab (
  id            serial primary key,
  user_id       int not null references users(id) on delete cascade,
  vocab_id      int not null references vocab(id) on delete cascade,
  ease          numeric(4,2) not null default 2.50,
  interval_days int  not null default 0,
  repetitions   int  not null default 0,
  lapses        int  not null default 0,
  due_at        timestamptz not null default now(),
  last_quality  int,
  last_seen     timestamptz,
  unique (user_id, vocab_id)
);
create index if not exists idx_user_vocab_due on user_vocab (user_id, due_at);

-- Every correction, categorised. This is what stops the tutor being a goldfish.
create table if not exists error_log (
  id           serial primary key,
  user_id      int not null references users(id) on delete cascade,
  category     text not null,   -- clitic_placement, ser_estar, subjunctive, gender_agreement,
                                -- preterite_imperfect, brazilian_form, prepositions, vocab_choice
  skill        text,            -- writing, speaking, converse
  learner_text text,
  correction   text,
  explanation  text,
  resolved     boolean not null default false,
  created_at   timestamptz default now()
);
create index if not exists idx_error_user_cat on error_log (user_id, category, created_at desc);

create table if not exists sessions (
  id               serial primary key,
  user_id          int not null references users(id) on delete cascade,
  mode             text not null,   -- phonics, vocab, listen, speak, write, converse
  duration_seconds int default 0,
  items_attempted  int default 0,
  items_correct    int default 0,
  created_at       timestamptz default now()
);

-- Formal level gates. Only these move users.level.
create table if not exists assessments (
  id           serial primary key,
  user_id      int not null references users(id) on delete cascade,
  level_tested text not null,
  passed       boolean not null,
  overall      numeric(4,2),
  detail       jsonb,
  created_at   timestamptz default now()
);

-- Conversation memory for converse mode.
create table if not exists turns (
  id         serial primary key,
  user_id    int not null references users(id) on delete cascade,
  role       text not null,   -- user | assistant
  content    text not null,
  created_at timestamptz default now()
);
create index if not exists idx_turns_user on turns (user_id, created_at desc);
