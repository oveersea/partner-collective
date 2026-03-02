ALTER TABLE public.hiring_requests
ALTER COLUMN required_skills TYPE text[]
USING (
  CASE
    WHEN required_skills IS NULL THEN NULL
    ELSE required_skills::text[]
  END
);