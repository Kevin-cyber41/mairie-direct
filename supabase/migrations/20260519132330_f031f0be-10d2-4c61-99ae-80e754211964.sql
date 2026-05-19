ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
ALTER TABLE public.reports REPLICA IDENTITY FULL;