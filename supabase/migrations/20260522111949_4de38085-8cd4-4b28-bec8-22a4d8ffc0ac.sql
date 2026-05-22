
-- Internal comments on reports
CREATE TABLE public.report_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  author_name text,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_report_comments_report ON public.report_comments(report_id);

ALTER TABLE public.report_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents view comments"
  ON public.report_comments FOR SELECT
  USING (public.has_role(auth.uid(), 'agent') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents insert comments"
  ON public.report_comments FOR INSERT
  WITH CHECK ((public.has_role(auth.uid(), 'agent') OR public.has_role(auth.uid(), 'admin')) AND auth.uid() = author_id);

-- Allow agents/admins to see all profiles (for showing agent names)
CREATE POLICY "Agents view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'agent') OR public.has_role(auth.uid(), 'admin'));

-- Allow agents/admins to see all user_roles (for listing agents)
CREATE POLICY "Agents view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'agent') OR public.has_role(auth.uid(), 'admin'));
