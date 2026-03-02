

# Vendor Dashboard & Team Dashboard - Full Suite

## Overview
- `/vendor/:slug` — Dashboard vendor (full suite + Business KYC)
- `/team/:slug` — Dashboard team (full suite, tanpa KYC, tapi perlu approval admin)

## Database Changes

### 1. partner_teams — tambah kolom approval
- `approval_status` (enum: pending, approved, rejected, merged) default 'pending'
- `admin_notes` text nullable  
- `suggested_team_id` uuid nullable (FK ke partner_teams, untuk suggest merge)
- `rejection_reason` text nullable

### 2. team_approval_requests (tabel baru)
- `id`, `team_id` (FK partner_teams), `requested_by`, `status`, `admin_notes`, `suggested_team_id`, `reviewed_by`, `reviewed_at`, `created_at`

## Pages & Components

### Vendor Dashboard (`/vendor/:slug`)
Tabs: Overview, Members, Documents, KYC, Projects/Orders, Credits
- Overview: info bisnis, stats
- Members: invite, role management (owner/admin/member)  
- Documents: upload & manage business docs
- KYC: business KYC submission & status
- Projects: order claims yang diterima vendor
- Credits: company_credits balance & transactions

### Team Dashboard (`/team/:slug`)
Tabs: Overview, Members, Projects
- Overview: team info, skills, status approval
- Members: invite, role management (leader/member)
- Projects: order claims yang diterima team
- Approval banner: status pending/approved/rejected + suggested team info

## Routing
- Tambah routes di App.tsx
- Link dari TeamsTab ke `/team/:slug`
- Link dari dashboard vendor list ke `/vendor/:slug`

## Admin Side (existing AdminTeams, AdminVendors)
- Admin bisa approve/reject team creation
- Admin bisa suggest existing team saat reject
- Admin bisa manage business KYC (sudah ada di AdminKYC)

## Implementation Order
1. Database migration (approval columns + team_approval table)
2. Vendor Dashboard page (reuse business_profiles data)
3. Team Dashboard page
4. Update TeamsTab to link ke team dashboard
5. Update routing
6. Update admin panel for team approval flow

