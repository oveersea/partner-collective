

## Plan: Create Learning Program Page (Admin)

### Current State
- `AdminLearning` component lists programs in a table with search/pagination
- `AdminProgramEdit` page (`/admin/program/:oveercode`) handles **editing** existing programs -- full-page layout with cards for basic info, status, pricing, learning details, instructors, and admin notes
- The `programs` table requires: `title` (string), `slug` (string), `instructor_id` (string) as mandatory insert fields. Other fields have defaults.
- There is NO "Create New Program" flow yet -- only edit existing ones.

### What to Build

**1. Add "Create Program" button to `AdminLearning` component**
- Place a `+ Buat Program` button next to the search bar in the header
- On click, navigate to `/admin/program/new`

**2. Modify `AdminProgramEdit` to support create mode**
- Currently the page only loads an existing program by `oveercode` param
- When `oveercode === "new"`, switch to **create mode**:
  - Initialize empty `ProgramData` with sensible defaults (status: "draft", category: "online", certificate_method: "none")
  - Generate a slug from the title on the fly (lowercase, hyphenated)
  - Use the current user's ID as `instructor_id` (required field) -- admin can change later via instructor selector
  - On save, call `supabase.from("programs").insert(...)` instead of `.update(...)`
  - After successful insert, navigate to `/admin/program/:oveercode` (the newly created program's oveercode)
- Header shows "Program Baru" instead of the oveercode/title when in create mode
- Save button label changes to "Buat Program" in create mode

**3. Files to modify:**
- `src/components/admin/AdminLearning.tsx` -- add create button
- `src/pages/AdminProgramEdit.tsx` -- add create mode logic

No database changes needed -- the `programs` table already has auto-generated `oveercode`, `slug` trigger, and appropriate defaults.

### Technical Details

**Slug generation**: Generate client-side from title: `title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()`. The DB trigger `generate_opportunity_slug` style function likely exists for programs too, but we provide a client-side slug since it's a required insert field.

**instructor_id**: Required non-nullable field. Use `auth.uid()` as placeholder on insert. The admin can reassign via the instructor selector.

**Insert payload**: Strip `id`, `created_at`, `updated_at`, `oveercode`, `approved_at` from the data object. Include `title`, `slug`, `category`, `status`, `instructor_id`, and all other editable fields.

**Post-insert flow**: After insert, fetch the created row to get the generated `oveercode`, then `navigate(`/admin/program/${oveercode}`)` to switch to edit mode seamlessly.

