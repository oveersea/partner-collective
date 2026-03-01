

## Add Learning, Assessment & Insights Management to Admin Panel

### Overview
Add 3 new admin sections to the superadmin sidebar and dashboard, leveraging existing database tables: `learning_programs`, `competency_tests` (assessments), and `insight_services`/`surveys`.

### Changes

#### 1. Update AdminSidebar (`src/components/admin/AdminSidebar.tsx`)
Add 3 new menu items to the `sections` array:
- **Learning Program** (icon: `GraduationCap`, id: `learning`)
- **Assessment** (icon: `ClipboardCheck`, id: `assessment`)
- **Insights & Survey** (icon: `BarChart3`, id: `insights`)

#### 2. Create `AdminLearning.tsx` (`src/components/admin/AdminLearning.tsx`)
Management panel for `learning_programs` table (20 records exist). Features:
- Table listing: title, category, skill_name, difficulty_level, program_type, duration_hours, price, is_active, oveercode, created_at
- Toggle active/inactive (`is_active`)
- Enrollment stats from `learning_enrollments` (count per program)
- Search + pagination (reuse PAGE_SIZE=20 pattern from AdminContent)

#### 3. Create `AdminAssessment.tsx` (`src/components/admin/AdminAssessment.tsx`)
Management panel for `competency_tests` table (1 record exists) + `assessment_orders`. Features:
- Table listing: title, skill_name, assessment_type, test_tier, total_questions, passing_score, time_limit, price, is_active
- Toggle active/inactive
- Sub-tab for Assessment Orders from `assessment_orders`: order_number, user, status, amount, payment confirmation (approve/reject)
- Search + pagination

#### 4. Create `AdminInsights.tsx` (`src/components/admin/AdminInsights.tsx`)
Management panel for `insight_services` + `surveys` (3 surveys exist). Features:
- Two tabs: "Insight Services" and "Surveys"
- Insight Services table: title, tagline, icon_name, sort_order, is_active, toggle active
- Surveys table: title, category, status, total_responses, starts_at, ends_at, toggle status
- Search + pagination

#### 5. Update AdminDashboard (`src/pages/AdminDashboard.tsx`)
- Import the 3 new components
- Add cases to `renderContent()` switch: `learning`, `assessment`, `insights`

### Technical Details

All 3 new components follow the exact same pattern as `AdminContent.tsx`:
- Fetch data from Supabase on mount
- Filter with search input
- Paginate with PAGE_SIZE=20
- Status badge helper
- Toggle status with update query + toast feedback
- Consistent table styling with `bg-card rounded-2xl border border-border`

Database tables used (read-only exploration confirmed):
| Section | Primary Table | Related Tables |
|---|---|---|
| Learning | `learning_programs` | `learning_enrollments`, `learning_modules` |
| Assessment | `competency_tests` | `assessment_orders`, `assessment_attempts` |
| Insights | `insight_services`, `surveys` | `insight_subscriptions`, `survey_responses` |

