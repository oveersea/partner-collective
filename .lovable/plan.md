

## Plan: Merge "Hiring & Matching" into "Request & Order"

### What changes

1. **Remove "Hiring & Matching" from sidebar** -- Delete the `hiring` entry from `adminSections` in `AdminSidebar.tsx` and remove the `Briefcase` icon import.

2. **Remove hiring case from AdminDashboard** -- Remove the `import AdminHiring` and the `case "hiring"` from the `renderContent()` switch in `AdminDashboard.tsx`.

3. **Add Shortage Alerts tab to AdminRequests** -- The unique feature in `AdminHiring` that is NOT already in `AdminRequests` is the **Talent Shortage Alerts** tab (fetching from `talent_shortage_alerts`). This will be integrated into `AdminRequests.tsx` as an additional tab alongside the existing "All / Urgent / Pending / In Progress / Overdue / Completed" tabs. Specifically:
   - Add a new tab "Shortage Alerts" with an `AlertTriangle` icon and badge count.
   - Fetch `talent_shortage_alerts` data inside `fetchRequests()`.
   - Render the alerts table (skills, shortage count, SLA type, status, date) when the tab is active.

4. **Keep AdminHiringDetail route** -- The `/admin/hiring/:oveercode` detail page remains intact since hiring requests in the unified view can still navigate to it.

5. **Optionally delete `AdminHiring.tsx`** -- Since it will no longer be referenced anywhere.

### Files to modify
- `src/components/admin/AdminSidebar.tsx` -- Remove `hiring` from `adminSections`
- `src/pages/AdminDashboard.tsx` -- Remove `AdminHiring` import and case
- `src/components/admin/AdminRequests.tsx` -- Add shortage alerts fetch + tab + table
- `src/components/admin/AdminHiring.tsx` -- Delete file (no longer used)

