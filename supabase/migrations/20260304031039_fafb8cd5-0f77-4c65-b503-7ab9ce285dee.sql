
CREATE OR REPLACE FUNCTION public.migrate_cv_archive_to_profiles()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rec RECORD;
  exp_item jsonb;
  edu_item jsonb;
  cert_item jsonb;
  lang_item jsonb;
  admin_id uuid := '10a647d2-12ea-41ba-814f-25c6e35d509b';
  migrated int := 0;
  lang_text text;
  yr int;
BEGIN
  FOR rec IN
    SELECT ca.*, au.id AS auth_user_id
    FROM candidates_archive ca
    JOIN auth.users au ON LOWER(au.email) = LOWER(TRIM(ca.email))
    WHERE ca.email IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM user_experiences ue WHERE ue.user_id = au.id LIMIT 1)
    AND NOT EXISTS (SELECT 1 FROM user_education ued WHERE ued.user_id = au.id LIMIT 1)
  LOOP
    -- Update profile
    UPDATE profiles SET
      phone_number = COALESCE(NULLIF(rec.phone, ''), phone_number),
      city = COALESCE(NULLIF(rec.city, ''), city),
      country = COALESCE(NULLIF(rec.country, ''), country),
      nationality = COALESCE(NULLIF(rec.nationality, ''), nationality),
      headline = COALESCE(NULLIF(rec.current_title, ''), headline),
      professional_summary = COALESCE(NULLIF(rec.summary, ''), professional_summary),
      skills = COALESCE(rec.skills, skills)
    WHERE user_id = rec.auth_user_id;

    -- Languages
    IF rec.languages IS NOT NULL AND jsonb_typeof(rec.languages::jsonb) = 'array' AND jsonb_array_length(rec.languages::jsonb) > 0 THEN
      lang_text := '';
      FOR lang_item IN SELECT * FROM jsonb_array_elements(rec.languages::jsonb) LOOP
        IF jsonb_typeof(lang_item) = 'string' THEN
          lang_text := lang_text || trim('"' FROM lang_item::text) || ', ';
        ELSIF lang_item->>'language' IS NOT NULL THEN
          lang_text := lang_text || (lang_item->>'language');
          IF lang_item->>'proficiency' IS NOT NULL THEN
            lang_text := lang_text || ' (' || (lang_item->>'proficiency') || ')';
          END IF;
          lang_text := lang_text || ', ';
        END IF;
      END LOOP;
      lang_text := rtrim(lang_text, ', ');
      IF lang_text != '' THEN
        UPDATE profiles SET languages = lang_text WHERE user_id = rec.auth_user_id;
      END IF;
    END IF;

    -- Work experiences (dates are free-text like "Jan 2018", skip date parsing)
    IF rec.work_experience IS NOT NULL AND jsonb_typeof(rec.work_experience::jsonb) = 'array' THEN
      FOR exp_item IN SELECT * FROM jsonb_array_elements(rec.work_experience::jsonb) LOOP
        INSERT INTO user_experiences (user_id, company, position, is_current, description, location, status, reviewed_by, reviewed_at)
        VALUES (
          rec.auth_user_id,
          COALESCE(exp_item->>'company', 'Unknown Company'),
          COALESCE(exp_item->>'title', exp_item->>'position', 'Unknown Position'),
          COALESCE((exp_item->>'is_current')::boolean, false),
          exp_item->>'description',
          exp_item->>'location',
          'approved', admin_id, now()
        );
      END LOOP;
    END IF;

    -- Education
    IF rec.education IS NOT NULL AND jsonb_typeof(rec.education::jsonb) = 'array' THEN
      FOR edu_item IN SELECT * FROM jsonb_array_elements(rec.education::jsonb) LOOP
        INSERT INTO user_education (user_id, institution, degree, field_of_study, start_date, end_date, description, status, reviewed_by, reviewed_at)
        VALUES (
          rec.auth_user_id,
          COALESCE(edu_item->>'institution', 'Unknown Institution'),
          edu_item->>'degree',
          COALESCE(edu_item->>'field_of_study', edu_item->>'field'),
          CASE WHEN (edu_item->>'start_year') IS NOT NULL AND (edu_item->>'start_year')::int > 1900 THEN
            make_date((edu_item->>'start_year')::int, 1, 1) ELSE NULL END,
          CASE WHEN (edu_item->>'end_year') IS NOT NULL AND (edu_item->>'end_year')::int > 1900 THEN
            make_date((edu_item->>'end_year')::int, 1, 1) ELSE NULL END,
          CASE WHEN (edu_item->>'gpa') IS NOT NULL THEN 'GPA: ' || (edu_item->>'gpa') ELSE NULL END,
          'approved', admin_id, now()
        );
      END LOOP;
    END IF;

    -- Certifications
    IF rec.certifications IS NOT NULL AND jsonb_typeof(rec.certifications::jsonb) = 'array' THEN
      FOR cert_item IN SELECT * FROM jsonb_array_elements(rec.certifications::jsonb) LOOP
        IF (cert_item->>'name') IS NOT NULL AND (cert_item->>'name') != '' THEN
          yr := CASE WHEN (cert_item->>'year') IS NOT NULL AND (cert_item->>'year')::int > 1900 THEN (cert_item->>'year')::int ELSE NULL END;
          INSERT INTO user_certifications (user_id, name, issuing_organization, issue_date, status, reviewed_by, reviewed_at)
          VALUES (
            rec.auth_user_id,
            cert_item->>'name',
            COALESCE(NULLIF(cert_item->>'issuer', 'null'), 'Unknown'),
            CASE WHEN yr IS NOT NULL THEN make_date(yr, 1, 1) ELSE NULL END,
            'approved', admin_id, now()
          );
        END IF;
      END LOOP;
    END IF;

    migrated := migrated + 1;
  END LOOP;

  RETURN jsonb_build_object('migrated', migrated);
END;
$$;

SELECT public.migrate_cv_archive_to_profiles();

DROP FUNCTION public.migrate_cv_archive_to_profiles();
