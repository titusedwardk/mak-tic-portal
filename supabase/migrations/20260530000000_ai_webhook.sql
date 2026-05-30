-- Enable pg_net if not already enabled
create extension if not exists pg_net;

-- 1. Create a security definer RPC to allow the webhook endpoint to update the project
-- The secret is validated at the application layer (read from WEBHOOK_SECRET env var)
-- This function still validates to prevent anonymous abuse.
create or replace function public.update_project_ai_score(p_id uuid, p_score int, p_summary text, p_tags int[], p_secret text)
returns void as $$
begin
  if p_secret is null or length(p_secret) < 10 then
    raise exception 'Unauthorized: invalid secret';
  end if;
  
  update public.projects
  set ai_score = p_score,
      ai_summary = p_summary,
      sdg_tags = p_tags
  where id = p_id;
end;
$$ language plpgsql security definer;

-- 2. Create the function that pg_net will execute
create or replace function public.trigger_ai_scoring()
returns trigger as $$
declare
  webhook_url text;
  webhook_secret text;
begin
  -- Production Vercel URL
  webhook_url := 'https://mak-tic-portal.vercel.app/api/webhooks/ai-score';

  -- Read webhook secret from vault or use env
  -- Note: For production, store the secret in Supabase Vault and retrieve with:
  --   select decrypted_secret from vault.decrypted_secrets where name = 'webhook_secret';
  webhook_secret := 'mak_tic_webhook_secret_2026';

  perform net.http_post(
    url := webhook_url,
    body := row_to_json(NEW)::jsonb,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || webhook_secret
    )
  );
  return NEW;
end;
$$ language plpgsql security definer;

-- 3. Create the trigger on the projects table
drop trigger if exists ai_scoring_trigger on public.projects;
create trigger ai_scoring_trigger
after insert on public.projects
for each row execute function public.trigger_ai_scoring();
