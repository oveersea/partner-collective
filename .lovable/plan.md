

## Problem

The profile completion percentage (`calcProfileScore` in `AdminUsers.tsx` and `calcProfileCompleteness` in `AdminUserDetail.tsx`) currently checks only 10 basic profile fields from the `profiles` table. It does not verify whether the user actually has:

- **Experience records** (from `user_experiences` table)
- **Education records** (from `user_education` table)
- **Certifications** (from `user_certifications` table)

This means a user who fills in basic text fields like `full_name`, `phone_number`, `city`, `bio`, `skills`, `highest_education` can already reach 60%+ without any real experience or education data.

Additionally, the `send-daily-job-match` edge function has its own simpler 5-field completion check that also ignores these records.

## Plan

### 1. Update profile completion logic in `AdminUsers.tsx`

Modify `calcProfileScore` to include 14 criteria (instead of 10):

| # | Field | Check |
|---|-------|-------|
| 1 | full_name | non-empty |
| 2 | avatar_url | non-empty |
| 3 | phone_number | non-empty |
| 4 | skills | length > 0 |
| 5 | years_of_experience | > 0 |
| 6 | highest_education | non-empty |
| 7 | bio / professional_summary | non-empty |
| 8 | city or country | non-empty |
| 9 | linkedin_url or website_url | non-empty |
| 10 | kyc_status | verified/approved |
| 11 | date_of_birth | non-empty |
| 12 | nationality | non-empty |
| 13 | has experience records | count > 0 (from fetched data) |
| 14 | has education records | count > 0 (from fetched data) |

Since the AdminUsers list page needs experience/education counts per user, we'll fetch aggregate counts. Two approaches:

- **Option A**: Fetch `user_experiences` and `user_education` counts in bulk alongside the users query (two additional queries, group by user_id).
- **Option B**: Add `experience_count` and `education_count` as computed/stored fields on profiles (requires migration).

**Option A** is simpler and avoids schema changes. We'll fetch counts for all displayed users and pass them to the score function.

### 2. Update the same logic in `AdminUserDetail.tsx`

The `calcProfileCompleteness` function will be updated with the same 14 criteria. This page already fetches experience and education data, so we just need to pass the counts.

### 3. Update `send-daily-job-match` edge function

Update the completion calculation to use the expanded criteria (or at minimum add experience check since it already checks `years_of_experience`).

### Files to modify

- `src/components/admin/AdminUsers.tsx` — update `calcProfileScore`, add experience/education count queries
- `src/pages/AdminUserDetail.tsx` — update `calcProfileCompleteness` to include experience/education counts
- `supabase/functions/send-daily-job-match/index.ts` — update completion calculation

