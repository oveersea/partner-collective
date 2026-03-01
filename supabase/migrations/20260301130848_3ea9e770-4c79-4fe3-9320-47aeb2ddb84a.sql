-- Migrate existing skills array to technical_skills jsonb (score default 10)
UPDATE public.profiles
SET technical_skills = (
  SELECT jsonb_agg(jsonb_build_object('name', skill, 'score', 10))
  FROM unnest(skills) AS skill
)
WHERE skills IS NOT NULL
  AND array_length(skills, 1) > 0
  AND (technical_skills IS NULL OR technical_skills = '[]'::jsonb);