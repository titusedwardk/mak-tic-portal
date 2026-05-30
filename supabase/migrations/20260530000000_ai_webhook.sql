-- Enable pg_net if not already enabled
create extension if not exists pg_net;

-- 1. Create a security definer RPC to allow the webhook endpoint to update the project without the Service Role Key
create or replace function public.update_project_ai_score(p_id uuid, p_score int, p_summary text, p_tags int[], p_secret text)
returns void as $$
begin
  -- Validate the secret to ensure only authorized clients can call this
  if p_secret != 'mak_tic_webhook_secret_2026' then
    raise exception 'Unauthorized';
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
begin
  -- In a real production environment, you would use the production Vercel URL.
  -- Since we are testing, we'll hit the Next.js endpoint. 
  -- Assuming local development via ngrok or production Vercel. 
  -- We'll use a placeholder for the host that Next.js will need to configure or we can just point to the production Vercel app.
  -- For now, let's use the local API URL or a Vercel URL. 
  
  -- We will use the Vercel app URL for production:
  webhook_url := 'https://mak-tic-portal.vercel.app/api/webhooks/ai-score';

  perform net.http_post(
    url := webhook_url,
    body := row_to_json(NEW)::jsonb,
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer mak_tic_webhook_secret_2026"}'::jsonb
  );
  return NEW;
end;
$$ language plpgsql security definer;

-- 3. Create the trigger on the projects table
drop trigger if exists ai_scoring_trigger on public.projects;
create trigger ai_scoring_trigger
after insert on public.projects
for each row execute function public.trigger_ai_scoring();
