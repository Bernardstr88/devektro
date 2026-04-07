-- Audit Log Migration
-- Run this in the Supabase SQL editor to enable change tracking.

-- 1. Create the audit_logs table
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id text,
  operation text not null,       -- INSERT | UPDATE | DELETE
  changed_by uuid references auth.users(id) on delete set null,
  changed_by_email text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

-- 2. Index for fast lookup by table + record
create index if not exists audit_logs_table_record_idx on audit_logs (table_name, record_id);
create index if not exists audit_logs_created_at_idx on audit_logs (created_at desc);

-- 3. Row-Level Security: authenticated users can view, nobody can insert/update/delete directly
alter table audit_logs enable row level security;

create policy "authenticated users can view audit logs"
  on audit_logs for select
  to authenticated
  using (true);

-- 4. Trigger function — called after every change
create or replace function log_audit_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_email text;
begin
  -- Resolve email from auth.users
  select email into v_user_email from auth.users where id = auth.uid();

  insert into audit_logs (table_name, record_id, operation, changed_by, changed_by_email, old_data, new_data)
  values (
    TG_TABLE_NAME,
    case
      when TG_OP = 'DELETE' then (OLD.id)::text
      else (NEW.id)::text
    end,
    TG_OP,
    auth.uid(),
    v_user_email,
    case when TG_OP = 'INSERT' then null else to_jsonb(OLD) end,
    case when TG_OP = 'DELETE' then null else to_jsonb(NEW) end
  );

  return coalesce(NEW, OLD);
end;
$$;

-- 5. Attach triggers to the key tables
do $$
declare
  tbl text;
begin
  foreach tbl in array array['installations','materials','maintenance_records','tasks','financials','installation_configs','generator_maintenance']
  loop
    execute format(
      'drop trigger if exists audit_%I on %I; create trigger audit_%I after insert or update or delete on %I for each row execute function log_audit_event();',
      tbl, tbl, tbl, tbl
    );
  end loop;
end;
$$;
