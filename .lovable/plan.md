

## Change All Fonts to Inter with Softer Bold Weights

### Overview
Replace the current dual-font system (Space Grotesk for headings + Plus Jakarta Sans for body) with a single **Inter** font family. Reduce heavy bold weights (`font-bold` / 700, `font-extrabold` / 800) to medium-bold levels (`font-semibold` / 600) across the entire app.

### Changes

#### 1. Google Fonts Import (`src/index.css`, line 1)
Replace the current import:
```
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
```
Remove Space Grotesk and Plus Jakarta Sans entirely. Import Inter with weights 400 (regular), 500 (medium), 600 (semibold), 700 (bold -- used sparingly).

#### 2. Tailwind Font Config (`tailwind.config.ts`, lines 17-18)
Update both `display` and `body` font families to Inter:
```ts
fontFamily: {
  display: ['"Inter"', 'system-ui', 'sans-serif'],
  body: ['"Inter"', 'system-ui', 'sans-serif'],
},
```

#### 3. Reduce Bold Weights Across ~33 Files
Global find-and-replace across all `.tsx` files in `src/`:

| Current class | Replacement |
|---|---|
| `font-extrabold` | `font-semibold` |
| `font-black` | `font-semibold` |
| `font-bold` (on headings h1-h6, large text) | `font-semibold` |
| `font-bold` (on small UI elements like logos, badges) | Keep as `font-semibold` |

Key files affected:
- `src/components/landing/Navbar.tsx` -- logo text, mega menu titles
- `src/components/landing/HeroSection.tsx` -- hero heading
- `src/components/landing/FeaturesSection.tsx`, `CaseStudiesSection.tsx`, `CTASection.tsx`, `HowItWorksSection.tsx`, `Footer.tsx`
- `src/components/dashboard/DashboardNav.tsx`, `ProfileHeader.tsx`, `ProfileOverview.tsx`, `ProfileEditForm.tsx`
- `src/components/admin/AdminSidebar.tsx`, `AdminOverview.tsx`, `AdminUsers.tsx`, `AdminContent.tsx`, `AdminCredits.tsx`, `AdminHiring.tsx`, `AdminKYC.tsx`, `AdminCompanies.tsx`
- `src/pages/` -- all page files (Dashboard, AuthPage, Matchmaking, JobDetail, Learning, LearningDetail, etc.)

The approach: replace **all** `font-bold` with `font-semibold` and all `font-extrabold`/`font-black` with `font-semibold` project-wide to achieve the medium-bold look.

#### 4. Inline Style Font Weights
Check for any inline `style={{ fontWeight: ... }}` and normalize to 500-600 range.

### Result
- Single consistent font (Inter) across all UI
- Headings and emphasis text use `font-semibold` (600) instead of `font-bold` (700) or heavier
- Cleaner, more modern typographic feel with less visual heaviness

