-- Galaxxy Study Hub - Supabase PostgreSQL Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID extension (usually already enabled)
create extension if not exists "uuid-ossp";

-- Users table (synced from Supabase Auth)
create table if not exists users (
    id text primary key,
    email varchar(255) unique not null,
    display_name varchar(255),
    avatar_url text,
    created_at timestamptz default now()
);

-- Chapters table
create table if not exists chapters (
    id serial primary key,
    user_id text not null references users(id) on delete cascade,
    title varchar(255) not null,
    description text,
    is_public boolean not null default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index idx_chapters_user_id on chapters(user_id);

-- Topics table
create table if not exists topics (
    id serial primary key,
    chapter_id integer not null references chapters(id) on delete cascade,
    title varchar(255) not null,
    order_index integer not null default 0,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index idx_topics_chapter_id on topics(chapter_id);

-- Contents table
create table if not exists contents (
    id serial primary key,
    topic_id integer not null references topics(id) on delete cascade,
    body text default '',
    content_type varchar(50) default 'markdown',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index idx_contents_topic_id on contents(topic_id);

-- Quiz History table
create table if not exists quiz_history (
    id serial primary key,
    user_id text not null references users(id) on delete cascade,
    chapter_id integer not null,
    chapter_title varchar(255),
    score integer not null default 0,
    total_questions integer not null default 0,
    questions_data jsonb,
    answers_data jsonb,
    created_at timestamptz default now()
);

create index idx_quiz_history_user_id on quiz_history(user_id);
create index idx_quiz_history_chapter_id on quiz_history(chapter_id);

-- Row Level Security (RLS) policies
-- These ensure users can only access their own data at the database level

alter table users enable row level security;
alter table chapters enable row level security;
alter table topics enable row level security;
alter table contents enable row level security;
alter table quiz_history enable row level security;

-- Users can read/update their own profile
create policy "Users can view own profile" on users for select using (auth.uid() = id);
create policy "Users can update own profile" on users for update using (auth.uid() = id);

-- Chapters: users can only access their own
create policy "Users can view own chapters" on chapters for select using (auth.uid() = user_id);
create policy "Users can view public chapters" on chapters for select using (is_public = true);
create policy "Users can create chapters" on chapters for insert with check (auth.uid() = user_id);
create policy "Users can update own chapters" on chapters for update using (auth.uid() = user_id);
create policy "Users can delete own chapters" on chapters for delete using (auth.uid() = user_id);

-- Topics: users can only access topics in their own chapters
create policy "Users can view own topics" on topics
    for select using (exists (
        select 1 from chapters where chapters.id = topics.chapter_id and chapters.user_id = auth.uid()
    ));
create policy "Users can create topics" on topics
    for insert with check (exists (
        select 1 from chapters where chapters.id = topics.chapter_id and chapters.user_id = auth.uid()
    ));
create policy "Users can update own topics" on topics
    for update using (exists (
        select 1 from chapters where chapters.id = topics.chapter_id and chapters.user_id = auth.uid()
    ));
create policy "Users can delete own topics" on topics
    for delete using (exists (
        select 1 from chapters where chapters.id = topics.chapter_id and chapters.user_id = auth.uid()
    ));

-- Contents: users can only access contents in their own topics
create policy "Users can view own contents" on contents
    for select using (exists (
        select 1 from topics
        join chapters on chapters.id = topics.chapter_id
        where topics.id = contents.topic_id and chapters.user_id = auth.uid()
    ));
create policy "Users can create/update contents" on contents
    for all using (exists (
        select 1 from topics
        join chapters on chapters.id = topics.chapter_id
        where topics.id = contents.topic_id and chapters.user_id = auth.uid()
    ));

-- Quiz History: users can only access their own
create policy "Users can view own quiz history" on quiz_history for select using (auth.uid() = user_id);
create policy "Users can create quiz history" on quiz_history for insert with check (auth.uid() = user_id);
