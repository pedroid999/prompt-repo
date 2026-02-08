-- Create collections table
create table collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint collections_user_id_name_key unique (user_id, name)
);

-- Create collection_prompts join table
create table collection_prompts (
  collection_id uuid not null references collections(id) on delete cascade,
  prompt_id uuid not null references prompts(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (collection_id, prompt_id)
);

-- Enable RLS
alter table collections enable row level security;
alter table collection_prompts enable row level security;

-- Policies for collections
create policy "Users can view their own collections"
  on collections for select
  using (auth.uid() = user_id);

create policy "Users can insert their own collections"
  on collections for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own collections"
  on collections for update
  using (auth.uid() = user_id);

create policy "Users can delete their own collections"
  on collections for delete
  using (auth.uid() = user_id);

-- Policies for collection_prompts
create policy "Users can view entries in their collections"
  on collection_prompts for select
  using (
    exists (
      select 1 from collections c
      where c.id = collection_id
      and c.user_id = auth.uid()
    )
  );

create policy "Users can add entries to their collections"
  on collection_prompts for insert
  with check (
    exists (
      select 1 from collections c
      where c.id = collection_id
      and c.user_id = auth.uid()
    )
  );

create policy "Users can remove entries from their collections"
  on collection_prompts for delete
  using (
    exists (
      select 1 from collections c
      where c.id = collection_id
      and c.user_id = auth.uid()
    )
  );

-- Indexes for performance
create index idx_collection_prompts_prompt_id on collection_prompts(prompt_id);
create index idx_collection_prompts_collection_id on collection_prompts(collection_id);
