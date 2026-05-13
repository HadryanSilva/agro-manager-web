# UI Redesign — Emerald SaaS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernize the visual design by replacing DM Serif Display with Plus Jakarta Sans throughout, updating the color palette to an emerald/slate SaaS aesthetic, and refactoring the finance card to use global design tokens.

**Architecture:** All changes are purely CSS — no logic, routing, or component structure is touched. The foundation is `src/assets/base.css` (design tokens). Downstream components reference those tokens via `var(--*)`, so updating the token file propagates most changes automatically. The remaining work is removing inline `font-family: var(--font-display)` overrides scattered across 27 component files.

**Tech Stack:** Vue 3, plain CSS with CSS custom properties, Google Fonts (Plus Jakarta Sans).

---

## File Map

| File | Change type |
|---|---|
| `src/assets/base.css` | Replace font import + all color/shadow/radius tokens; remove `--font-display` |
| `src/layouts/AppLayout.vue` | Remove `var(--font-display)` from 3 selectors; add `font-weight: 800` to brand |
| `src/layouts/TraderLayout.vue` | Remove `var(--font-display)` from 3 selectors; add `font-weight: 800` to brand |
| `src/layouts/AuthLayout.vue` | Remove `var(--font-display)` from 3 selectors |
| `src/views/DashboardView.vue` | Remove `var(--font-display)` from 6 selectors; add `font-weight: 700`; refactor `.finance-card` to global tokens; remove non-scoped `<style>` block |
| `src/views/auth/LoginView.vue` | Remove `var(--font-display)` from 1 selector; adjust weight |
| `src/views/auth/RegisterView.vue` | Remove `var(--font-display)` from 1 selector; adjust weight |
| `src/views/onboarding/OnboardingView.vue` | Remove `var(--font-display)` from 1 selector |
| `src/views/onboarding/CreateAccountView.vue` | Remove `var(--font-display)` from 1 selector |
| `src/views/invite/InviteAcceptView.vue` | Remove `var(--font-display)` from 2 selectors |
| `src/views/trader/TraderDashboardView.vue` | Remove `var(--font-display)` from 4 selectors; adjust weights |
| `src/views/trader/TradingSuppliersView.vue` | Remove `var(--font-display)` from 1 selector |
| `src/views/trader/PurchaseLotsView.vue` | Remove `var(--font-display)` from 1 selector |
| `src/views/trader/PurchaseLotFormView.vue` | Remove `var(--font-display)` from 2 selectors |
| `src/views/trader/PurchaseLotDetailView.vue` | Remove `var(--font-display)` from 3 selectors |
| `src/views/sales/SalesView.vue` | Remove `var(--font-display)` from 1 selector |
| `src/views/reports/ReportsView.vue` | Remove `var(--font-display)` from 1 selector |
| `src/views/transactions/TransactionsView.vue` | Remove `var(--font-display)` from 1 selector |
| `src/views/transactions/GeneralExpenseFormView.vue` | Remove `var(--font-display)` from 1 selector |
| `src/views/expenses/ExpensesView.vue` | Remove `var(--font-display)` from 1 selector |
| `src/views/expenses/ExpenseFormView.vue` | Remove `var(--font-display)` from 1 selector |
| `src/views/quotations/QuotationsView.vue` | Remove `var(--font-display)` from 1 selector |
| `src/views/quotations/QuotationFormView.vue` | Remove `var(--font-display)` from 1 selector |
| `src/views/settings/AccountSettingsView.vue` | Remove `var(--font-display)` from 1 selector |
| `src/views/settings/MembersSettingsView.vue` | Remove `var(--font-display)` from 1 selector |
| `src/views/settings/ProfileSettingsView.vue` | Remove `var(--font-display)` from 1 selector |
| `src/views/farms/FarmsView.vue` | Remove `var(--font-display)` from 1 selector |
| `src/views/farms/FarmReportView.vue` | Remove `var(--font-display)` from 2 selectors |

---

## Task 1: Update design tokens in base.css

**Files:**
- Modify: `src/assets/base.css`

- [ ] **Step 1: Replace the full content of `src/assets/base.css`**

```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

/* ── Light Mode Tokens ──────────────────────────────────────────── */
:root {
  /* Typography */
  --font-body: 'Plus Jakarta Sans', sans-serif;

  /* Type Scale (base: 16px root) */
  --text-xs:   0.75rem;
  --text-sm:   0.875rem;
  --text-base: 1rem;
  --text-md:   1.125rem;
  --text-lg:   1.25rem;
  --text-xl:   1.5rem;
  --text-2xl:  1.75rem;
  --text-3xl:  2rem;
  --text-4xl:  2.5rem;
  --text-5xl:  3rem;

  /* Surfaces */
  --color-background:   #f9fafb;
  --color-surface:      #f3f4f6;
  --color-card:         #ffffff;
  --color-border:       #e5e7eb;
  --color-border-focus: #059669;

  /* Text */
  --color-text:             #111827;
  --color-text-muted:       #6b7280;
  --color-text-placeholder: #9ca3af;

  /* Primary — emerald */
  --color-primary:       #059669;
  --color-primary-dark:  #047857;
  --color-primary-light: #d1fae5;

  /* Accent — amber */
  --color-accent:        #d97706;
  --color-accent-light:  #fef3c7;

  /* Semantic */
  --color-success:       #059669;
  --color-success-light: #d1fae5;

  --color-warning:       #d97706;
  --color-warning-light: #fef3c7;

  --color-error:         #dc2626;
  --color-error-light:   #fee2e2;

  --color-info:          #2563eb;
  --color-info-light:    #dbeafe;

  /* Shadows */
  --shadow-card:       0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.06);
  --shadow-card-hover: 0 4px 8px rgba(0,0,0,0.08), 0 8px 20px rgba(0,0,0,0.07);
  --shadow-elevated:   0 8px 24px rgba(0,0,0,0.10);

  /* Radii */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
}

/* ── Dark Mode Tokens ───────────────────────────────────────────── */
[data-theme="dark"] {
  --color-background:   #0f172a;
  --color-surface:      #1e293b;
  --color-card:         #1e293b;
  --color-border:       #334155;
  --color-border-focus: #34d399;

  --color-text:             #f1f5f9;
  --color-text-muted:       #94a3b8;
  --color-text-placeholder: #475569;

  --color-primary:       #34d399;
  --color-primary-dark:  #10b981;
  --color-primary-light: #022c22;

  --color-accent:        #fbbf24;
  --color-accent-light:  #1c1408;

  --color-success:       #34d399;
  --color-success-light: #022c22;

  --color-warning:       #fbbf24;
  --color-warning-light: #1c1408;

  --color-error:         #f87171;
  --color-error-light:   #1f0a0a;

  --color-info:          #60a5fa;
  --color-info-light:    #0a1628;

  --shadow-card:       0 1px 3px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.4);
  --shadow-card-hover: 0 2px 8px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.5);
  --shadow-elevated:   0 4px 24px rgba(0,0,0,0.6);
}

/* ── Global Reset ───────────────────────────────────────────────── */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  font-weight: normal;
}

body {
  min-height: 100vh;
  color: var(--color-text);
  background: var(--color-background);
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: 1.6;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  transition: background-color 0.2s ease, color 0.2s ease;
}

#app {
  min-height: 100vh;
}
```

- [ ] **Step 2: Start the dev server and verify the font loads**

```bash
npm run dev
```

Open `http://localhost:5173`. The body text should render in Plus Jakarta Sans (no serifs anywhere). The background should be `#f9fafb` (slightly cooler than before). The sidebar and primary buttons should show emerald green (`#059669`).

- [ ] **Step 3: Commit**

```bash
git add src/assets/base.css
git commit -m "feat: update design tokens — Plus Jakarta Sans, emerald palette, slate dark mode"
```

---

## Task 2: Update AppLayout.vue

**Files:**
- Modify: `src/layouts/AppLayout.vue`

- [ ] **Step 1: Update `.sidebar__brand-name`**

Find (around line 256):
```css
.sidebar__brand-name {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1rem;
  color: var(--color-text);
  letter-spacing: -0.01em;
  line-height: 1;
}
```

Replace with:
```css
.sidebar__brand-name {
  font-size: 1rem;
  font-weight: 800;
  color: var(--color-text);
  letter-spacing: -0.02em;
  line-height: 1;
}
```

- [ ] **Step 2: Update `.topbar__brand`**

Find (around line 383):
```css
.topbar__brand {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1rem;
  color: var(--color-text);
  letter-spacing: -0.01em;
}
```

Replace with:
```css
.topbar__brand {
  font-size: 1rem;
  font-weight: 800;
  color: var(--color-text);
  letter-spacing: -0.02em;
}
```

- [ ] **Step 3: Update `.sidebar__user-initials`**

Find (around line 464):
```css
.sidebar__user-initials {
  font-family: var(--font-display);
  font-size: 0.75rem;
  color: var(--color-primary-light);
}
```

Replace with:
```css
.sidebar__user-initials {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-primary-light);
}
```

- [ ] **Step 4: Verify in browser**

Check the sidebar brand name "Agro Manager" — it should now be bold sans-serif, not italic serif. Check mobile topbar too.

- [ ] **Step 5: Commit**

```bash
git add src/layouts/AppLayout.vue
git commit -m "feat: remove serif font from AppLayout brand and user initials"
```

---

## Task 3: Update TraderLayout.vue

**Files:**
- Modify: `src/layouts/TraderLayout.vue`

- [ ] **Step 1: Read the file to identify the 3 selectors**

Open `src/layouts/TraderLayout.vue` and search for `var(--font-display)`. Note the selectors at lines ~229, ~380, ~436.

- [ ] **Step 2: Update brand/logo selector (around line 229)**

Find the selector containing:
```css
font-family: var(--font-display);
font-style: italic;
```

Remove `font-family: var(--font-display);` and `font-style: italic;`. Add `font-weight: 800;` and change `letter-spacing` to `-0.02em`.

- [ ] **Step 3: Update topbar brand selector (around line 380)**

Same pattern — remove `font-family: var(--font-display);` and `font-style: italic;`, add `font-weight: 800;`.

- [ ] **Step 4: Update user initials selector (around line 436)**

Remove `font-family: var(--font-display);`, add `font-weight: 700;`.

- [ ] **Step 5: Verify in browser**

Navigate to the Trader (Comprador) layout — brand name should be bold sans-serif.

- [ ] **Step 6: Commit**

```bash
git add src/layouts/TraderLayout.vue
git commit -m "feat: remove serif font from TraderLayout"
```

---

## Task 4: Update AuthLayout.vue

**Files:**
- Modify: `src/layouts/AuthLayout.vue`

- [ ] **Step 1: Read the file to identify the 3 selectors**

Open `src/layouts/AuthLayout.vue` and locate `var(--font-display)` at lines ~160, ~174, ~277.

- [ ] **Step 2: Update all 3 selectors**

For each occurrence, remove the line `font-family: var(--font-display);`. If the selector also has `font-style: italic`, remove that too. For selectors on headings or display values (large text), change `font-weight: 400` to `font-weight: 700`.

- [ ] **Step 3: Verify in browser**

Navigate to `/login`. The auth page heading/logo should be sans-serif.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/AuthLayout.vue
git commit -m "feat: remove serif font from AuthLayout"
```

---

## Task 5: Update auth and onboarding views

**Files:**
- Modify: `src/views/auth/LoginView.vue`
- Modify: `src/views/auth/RegisterView.vue`
- Modify: `src/views/onboarding/OnboardingView.vue`
- Modify: `src/views/onboarding/CreateAccountView.vue`
- Modify: `src/views/invite/InviteAcceptView.vue`

These files each have 1–2 occurrences of `var(--font-display)` on page title or heading selectors.

- [ ] **Step 1: Update LoginView.vue (line ~136)**

Read `src/views/auth/LoginView.vue`. Find the selector with `font-family: var(--font-display)`. Remove that line. If `font-weight: 400`, change to `font-weight: 700`.

- [ ] **Step 2: Update RegisterView.vue (line ~191)**

Same pattern as LoginView.

- [ ] **Step 3: Update OnboardingView.vue (line ~75)**

Read `src/views/onboarding/OnboardingView.vue`. Find the selector with `font-family: var(--font-display)`. Remove that line; change weight to `700`.

- [ ] **Step 4: Update CreateAccountView.vue (line ~136)**

Same pattern.

- [ ] **Step 5: Update InviteAcceptView.vue (lines ~182, ~248)**

Two selectors — apply the same change to both.

- [ ] **Step 6: Verify in browser**

Visit `/login`, `/register`, and the onboarding flow. All headings should be Plus Jakarta Sans bold.

- [ ] **Step 7: Commit**

```bash
git add src/views/auth/LoginView.vue src/views/auth/RegisterView.vue src/views/onboarding/OnboardingView.vue src/views/onboarding/CreateAccountView.vue src/views/invite/InviteAcceptView.vue
git commit -m "feat: remove serif font from auth and onboarding views"
```

---

## Task 6: Update DashboardView.vue (most complex)

**Files:**
- Modify: `src/views/DashboardView.vue`

This file has 6 occurrences of `var(--font-display)` plus a `.finance-card` that uses private `--_fc-*` tokens and a hardcoded background.

- [ ] **Step 1: Update `.dashboard__title` (around line 410)**

Find:
```css
.dashboard__title {
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 400;
  color: var(--color-text);
  letter-spacing: -0.02em;
  line-height: 1.2;
}
```

Replace with:
```css
.dashboard__title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
  line-height: 1.2;
}
```

- [ ] **Step 2: Update `.metric-card__value` (around line 510)**

Find:
```css
.metric-card__value {
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 400;
  color: var(--color-text);
  letter-spacing: -0.02em;
  line-height: 1;
}
```

Replace with:
```css
.metric-card__value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
  line-height: 1;
}
```

- [ ] **Step 3: Update `.metric-card__value--sm` (around line 518)**

Find:
```css
.metric-card__value--sm {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 400;
  letter-spacing: -0.01em;
}
```

Replace with:
```css
.metric-card__value--sm {
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}
```

- [ ] **Step 4: Update `.section__title` (around line 534)**

Find:
```css
.section__title {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 400;
  color: var(--color-text);
  margin-bottom: 1rem;
  letter-spacing: -0.01em;
}
```

Replace with:
```css
.section__title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 1rem;
  letter-spacing: -0.01em;
}
```

- [ ] **Step 5: Update `.finance-total__value` (around line 592)**

Find:
```css
.finance-total__value {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 400;
  color: var(--_fc-text-color, #e8f0ea);
  letter-spacing: -0.01em;
  word-break: break-word;
}
```

Replace with:
```css
.finance-total__value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.01em;
  word-break: break-word;
}
```

- [ ] **Step 6: Update `.status-card__count` (around line 664)**

Find:
```css
.status-card__count { font-family: var(--font-display); font-size: 1.5rem; font-weight: 400; color: var(--color-text); letter-spacing: -0.02em; }
```

Replace with:
```css
.status-card__count { font-size: 1.5rem; font-weight: 700; color: var(--color-text); letter-spacing: -0.02em; }
```

- [ ] **Step 7: Refactor `.finance-card` and its internal color selectors**

Find the `.finance-card` block:
```css
.finance-card {
  background: var(--_fc-bg, #1b3a2d);
  border-radius: var(--radius-md);
  padding: 1.25rem 1.5rem;
}
```

Replace with:
```css
.finance-card {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--color-primary);
  padding: 1.25rem 1.5rem;
}
```

- [ ] **Step 8: Update `.finance-total__label` color**

Find:
```css
.finance-total__label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--_fc-label-color, rgba(109, 191, 153, 0.75));
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
```

Replace with:
```css
.finance-total__label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
```

- [ ] **Step 9: Update paid/pending value colors**

Find:
```css
.finance-total--paid    .finance-total__value { color: var(--_fc-paid-color, #6dbf99); }
.finance-total--pending .finance-total__value { color: var(--_fc-pending-color, #c9a96e); }
```

Replace with:
```css
.finance-total--paid    .finance-total__value { color: var(--color-success); }
.finance-total--pending .finance-total__value { color: var(--color-accent); }
```

- [ ] **Step 10: Update finance bar colors**

Find:
```css
.finance-bar-track {
  flex: 1;
  height: 4px;
  background: var(--_fc-bar-track, rgba(255, 255, 255, 0.1));
  border-radius: 2px;
  overflow: hidden;
}

.finance-bar-fill {
  height: 100%;
  background: var(--_fc-bar-fill, #6dbf99);
  border-radius: 2px;
  transition: width 0.6s ease;
}

.finance-bar-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--_fc-bar-label, #6dbf99);
  white-space: nowrap;
}
```

Replace with:
```css
.finance-bar-track {
  flex: 1;
  height: 4px;
  background: var(--color-border);
  border-radius: 2px;
  overflow: hidden;
}

.finance-bar-fill {
  height: 100%;
  background: var(--color-success);
  border-radius: 2px;
  transition: width 0.6s ease;
}

.finance-bar-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-success);
  white-space: nowrap;
}
```

- [ ] **Step 11: Update `.finance-card__empty`**

Find:
```css
.finance-card__empty {
  font-size: 0.875rem;
  color: var(--_fc-empty-color, rgba(255, 255, 255, 0.5));
  text-align: center;
  padding: 0.5rem 0;
}
```

Replace with:
```css
.finance-card__empty {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  text-align: center;
  padding: 0.5rem 0;
}
```

- [ ] **Step 12: Remove the non-scoped `<style>` block**

At the bottom of `DashboardView.vue`, find and delete the entire non-scoped block:
```html
<style>
[data-theme="dark"] .finance-card {
  --_fc-bg: var(--color-card);
  --_fc-label-color: var(--color-text-muted);
  --_fc-text-color: var(--color-text);
  --_fc-paid-color: var(--color-success);
  --_fc-pending-color: var(--color-accent);
  --_fc-bar-track: var(--color-border);
  --_fc-bar-fill: var(--color-success);
  --_fc-bar-label: var(--color-success);
  --_fc-empty-color: var(--color-text-muted);
  border: 1px solid var(--color-border);
  border-left: 3px solid var(--color-primary);
}
</style>
```

- [ ] **Step 13: Verify in browser (light + dark)**

Open the dashboard. Check:
- Metric values are bold sans-serif
- Finance card has surface background + left border accent (not dark green)
- Finance card looks correct in both light and dark mode (toggle with ThemeToggle)

- [ ] **Step 14: Commit**

```bash
git add src/views/DashboardView.vue
git commit -m "feat: remove serif font and refactor finance card tokens in DashboardView"
```

---

## Task 7: Update trader views

**Files:**
- Modify: `src/views/trader/TraderDashboardView.vue`
- Modify: `src/views/trader/TradingSuppliersView.vue`
- Modify: `src/views/trader/PurchaseLotsView.vue`
- Modify: `src/views/trader/PurchaseLotFormView.vue`
- Modify: `src/views/trader/PurchaseLotDetailView.vue`

- [ ] **Step 1: Update TraderDashboardView.vue (4 selectors, lines ~184, ~232, ~289, ~367)**

Read the file. For each of the 4 selectors containing `font-family: var(--font-display)`:
- Remove `font-family: var(--font-display);`
- If `font-style: italic` is present, remove it too
- Change `font-weight: 400` to `font-weight: 700` on title/value selectors

- [ ] **Step 2: Update TradingSuppliersView.vue (1 selector, line ~248)**

Find `.page-title`:
```css
.page-title { font-family: var(--font-display); font-size: 1.75rem; font-weight: 400; color: var(--color-text); letter-spacing: -0.02em; line-height: 1.2; margin: 0 0 0.25rem; }
```

Replace with:
```css
.page-title { font-size: 1.75rem; font-weight: 700; color: var(--color-text); letter-spacing: -0.02em; line-height: 1.2; margin: 0 0 0.25rem; }
```

- [ ] **Step 3: Update PurchaseLotsView.vue (1 selector, line ~229)**

Same as TradingSuppliersView — find `.page-title`, remove `font-family: var(--font-display)`, change weight to `700`.

- [ ] **Step 4: Update PurchaseLotFormView.vue (2 selectors, lines ~278, ~293)**

Find `.page-title` (line ~278):
```css
.page-title { font-family: var(--font-display); font-size: 1.75rem; font-weight: 400; color: var(--color-text); letter-spacing: -0.02em; line-height: 1.2; margin: 0; }
```

Replace with:
```css
.page-title { font-size: 1.75rem; font-weight: 700; color: var(--color-text); letter-spacing: -0.02em; line-height: 1.2; margin: 0; }
```

Find `.form-section-title` (line ~293):
```css
.form-section-title { font-family: var(--font-display); font-size: 1rem; font-weight: 400; color: var(--color-text); letter-spacing: -0.01em; margin: 0; }
```

Replace with:
```css
.form-section-title { font-size: 1rem; font-weight: 700; color: var(--color-text); letter-spacing: -0.01em; margin: 0; }
```

- [ ] **Step 5: Update PurchaseLotDetailView.vue (3 selectors, lines ~411, ~451, ~486)**

Find `.page-title` (line ~411):
```css
.page-title { font-family: var(--font-display); font-size: 1.75rem; font-weight: 400; color: var(--color-text); letter-spacing: -0.02em; line-height: 1.2; margin: 0 0 0.25rem; }
```

Replace with:
```css
.page-title { font-size: 1.75rem; font-weight: 700; color: var(--color-text); letter-spacing: -0.02em; line-height: 1.2; margin: 0 0 0.25rem; }
```

Find `.kpi-card__value` (line ~451):
```css
.kpi-card__value { font-family: var(--font-display); font-size: 1.25rem; font-weight: 400; color: var(--color-text); letter-spacing: -0.01em; }
```

Replace with:
```css
.kpi-card__value { font-size: 1.25rem; font-weight: 700; color: var(--color-text); letter-spacing: -0.01em; }
```

Find `.section-title` (line ~486):
```css
.section-title { font-family: var(--font-display); font-size: 1rem; font-weight: 400; color: var(--color-text); letter-spacing: -0.01em; margin: 0; }
```

Replace with:
```css
.section-title { font-size: 1rem; font-weight: 700; color: var(--color-text); letter-spacing: -0.01em; margin: 0; }
```

- [ ] **Step 6: Verify in browser**

Navigate to the Comprador section — check Dashboard, Fornecedores, and Lotes pages. All page titles and KPI values should be bold sans-serif.

- [ ] **Step 7: Commit**

```bash
git add src/views/trader/TraderDashboardView.vue src/views/trader/TradingSuppliersView.vue src/views/trader/PurchaseLotsView.vue src/views/trader/PurchaseLotFormView.vue src/views/trader/PurchaseLotDetailView.vue
git commit -m "feat: remove serif font from trader views"
```

---

## Task 8: Update remaining views

**Files:**
- Modify: `src/views/sales/SalesView.vue`
- Modify: `src/views/reports/ReportsView.vue`
- Modify: `src/views/transactions/TransactionsView.vue`
- Modify: `src/views/transactions/GeneralExpenseFormView.vue`
- Modify: `src/views/expenses/ExpensesView.vue`
- Modify: `src/views/expenses/ExpenseFormView.vue`
- Modify: `src/views/quotations/QuotationsView.vue`
- Modify: `src/views/quotations/QuotationFormView.vue`
- Modify: `src/views/settings/AccountSettingsView.vue`
- Modify: `src/views/settings/MembersSettingsView.vue`
- Modify: `src/views/settings/ProfileSettingsView.vue`
- Modify: `src/views/farms/FarmsView.vue`
- Modify: `src/views/farms/FarmReportView.vue`

Each file has 1–2 occurrences of `font-family: var(--font-display)` on page title, section heading, or metric value selectors. The pattern is identical in each case.

- [ ] **Step 1: Apply the standard change to each file**

For every `font-family: var(--font-display)` occurrence in these files:

1. Remove the line `font-family: var(--font-display);`
2. If `font-style: italic` is on the same selector, remove it
3. If the selector has `font-weight: 400` on a heading or display value (large font size ≥ 1rem on a title), change it to `font-weight: 700`

Specific selectors to update per file:

| File | Selector | Line |
|---|---|---|
| `SalesView.vue` | page title selector | ~53 |
| `ReportsView.vue` | page title selector | ~148 |
| `TransactionsView.vue` | page title selector | ~407 |
| `GeneralExpenseFormView.vue` | page title selector | ~226 |
| `ExpensesView.vue` | page title selector | ~473 |
| `ExpenseFormView.vue` | page title selector | ~283 |
| `QuotationsView.vue` | `.quotations__title` | ~297 |
| `QuotationFormView.vue` | page title selector | ~322 |
| `AccountSettingsView.vue` | page title selector | ~215 |
| `MembersSettingsView.vue` | `.members__title` | ~351 |
| `ProfileSettingsView.vue` | page title selector | ~321 |
| `FarmsView.vue` | page title selector | ~245 |
| `FarmReportView.vue` | 2 selectors | ~470, ~582 |

- [ ] **Step 2: Verify no remaining occurrences**

Run a search to confirm all occurrences are gone:

```bash
grep -r "font-display" src/
```

Expected output: no results (empty).

- [ ] **Step 3: Verify in browser**

Browse through: Transações, Cotações, Despesas, Lavouras, Relatórios, Configurações. All page titles should be bold sans-serif.

- [ ] **Step 4: Commit**

```bash
git add src/views/sales/SalesView.vue src/views/reports/ReportsView.vue src/views/transactions/TransactionsView.vue src/views/transactions/GeneralExpenseFormView.vue src/views/expenses/ExpensesView.vue src/views/expenses/ExpenseFormView.vue src/views/quotations/QuotationsView.vue src/views/quotations/QuotationFormView.vue src/views/settings/AccountSettingsView.vue src/views/settings/MembersSettingsView.vue src/views/settings/ProfileSettingsView.vue src/views/farms/FarmsView.vue src/views/farms/FarmReportView.vue
git commit -m "feat: remove serif font from remaining views — redesign complete"
```

---

## Final Verification

- [ ] Toggle between light and dark mode on every main page — colors, shadows, and finance card should look correct in both
- [ ] Check mobile (≤768px) — topbar brand name should be bold sans-serif
- [ ] Run type check: `npm run type-check` — expected: no errors
- [ ] Build: `npm run build` — expected: no errors
