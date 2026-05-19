
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.log_status_change() SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;

-- Restrict public listing of bucket (only individual files via known URL)
DROP POLICY "Public read photos" ON storage.objects;
CREATE POLICY "Public read photo objects" ON storage.objects FOR SELECT USING (bucket_id = 'photos' AND auth.role() IN ('anon','authenticated'));
