# Field Premium Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic design system with the Field Premium aesthetic — deep forest green + warm cream palette, DM Serif Display + DM Sans typography, refined sidebar, auth layout, and dashboard.

**Architecture:** All visual identity flows from `src/assets/base.css` (CSS custom properties). Changes cascade outward: tokens → layout shells (AppLayout, AuthLayout) → views (DashboardView) → auth forms (LoginView, RegisterView). No component logic changes — only CSS/`<style>` block edits and minimal template tweaks.

**Tech Stack:** Vue 3, TypeScript, Vite, scoped CSS in SFCs, CSS custom properties (no UI library)

**Dev server:** `npm run dev` — runs on http://localhost:5173 (or similar Vite port)

---

## File Map

| File | What changes |
|------|-------------|
| `src/assets/base.css` | Full token replacement + Google Fonts import + font-family |
| `src/layouts/AppLayout.vue` | Brand SVG + DM Serif italic + nav active border-left + ThemeToggle to footer |
| `src/layouts/AuthLayout.vue` | Brand serif italic + hero serif + em in accent + botanical SVG |
| `src/views/DashboardView.vue` | DM Serif on titles/metrics + dark finance card + token-aligned badge/icon colors |
| `src/views/auth/LoginView.vue` | Fix hardcoded focus ring rgba |
| `src/views/auth/RegisterView.vue` | Fix hardcoded focus ring rgba |

---

## Task 1: Design Tokens + Font — `src/assets/base.css`

**Files:**
- Modify: `src/assets/base.css`

- [ ] **Step 1: Replace entire `base.css` content**

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Serif+Display:ital@0;1&display=swap');

/* ── Light Mode Tokens ──────────────────────────────────────────── */
:root {
  /* Surfaces */
  --color-background:   #faf9f7;
  --color-surface:      #f5f2ed;
  --color-card:         #ffffff;
  --color-border:       #e4e0d8;
  --color-border-focus: #1b3a2d;

  /* Text */
  --color-text:             #1b3a2d;
  --color-text-muted:       #7b9e87;
  --color-text-placeholder: #a3c4b5;

  /* Primary — deep forest green */
  --color-primary:       #1b3a2d;
  --color-primary-dark:  #142d22;
  --color-primary-light: #e8f4ed;

  /* Accent — warm gold/wheat */
  --color-accent:        #c9a96e;
  --color-accent-light:  #f7f0e4;

  /* Semantic */
  --color-success:       #276749;
  --color-success-light: #e8f4ed;

  --color-warning:       #b7791f;
  --color-warning-light: #fef9ec;

  --color-error:         #c0392b;
  --color-error-light:   #fdf2f0;

  --color-info:          #2b6cb0;
  --color-info-light:    #ebf5ff;

  /* Shadows */
  --shadow-card:     0 1px 4px rgba(27, 58, 45, 0.06), 0 4px 16px rgba(27, 58, 45, 0.05);
  --shadow-card-hover: 0 2px 8px rgba(27, 58, 45, 0.09), 0 8px 24px rgba(27, 58, 45, 0.08);
  --shadow-elevated: 0 4px 24px rgba(27, 58, 45, 0.12);

  /* Radii */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;
  --radius-xl: 24px;
}

/* ── Dark Mode Tokens ───────────────────────────────────────────── */
[data-theme="dark"] {
  --color-background:   #0e1612;
  --color-surface:      #131d17;
  --color-card:         #182318;
  --color-border:       #2d4a38;
  --color-border-focus: #7b9e87;

  --color-text:             #e8f0ea;
  --color-text-muted:       #7b9e87;
  --color-text-placeholder: #4d7a5e;

  /* In dark mode primary becomes sage green for readability over dark bg */
  --color-primary:       #7b9e87;
  --color-primary-dark:  #6a8a75;
  --color-primary-light: #1a2e22;

  --color-accent:        #c9a96e;
  --color-accent-light:  #2a2010;

  --color-success:       #6dbf99;
  --color-success-light: #0d2218;

  --color-warning:       #e9a84c;
  --color-warning-light: #2a1e08;

  --color-error:         #e57373;
  --color-error-light:   #2a0d0d;

  --color-info:          #64b5f6;
  --color-info-light:    #0a1929;

  --shadow-card:       0 1px 3px rgba(0, 0, 0, 0.4), 0 4px 16px rgba(0, 0, 0, 0.35);
  --shadow-card-hover: 0 2px 8px rgba(0, 0, 0, 0.5), 0 8px 24px rgba(0, 0, 0, 0.4);
  --shadow-elevated:   0 4px 24px rgba(0, 0, 0, 0.5);
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
  font-family: 'DM Sans', sans-serif;
  font-size: 15px;
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

- [ ] **Step 2: Start dev server and verify tokens load**

```bash
npm run dev
```

Open http://localhost:5173. The app background should shift to warm cream `#faf9f7`, text should be deep forest green `#1b3a2d`. The primary green accent on nav items/buttons should be a darker, more refined green.

- [ ] **Step 3: Commit**

```bash
git add src/assets/base.css
git commit -m "feat: replace design tokens with Field Premium palette and fonts"
```

---

## Task 2: AppLayout — Sidebar Redesign

**Files:**
- Modify: `src/layouts/AppLayout.vue`

- [ ] **Step 1: Replace the `<template>` section**

Replace the entire `<template>` block with the following. The key changes are: (1) brand icon becomes a dark SVG container, (2) brand name uses `.sidebar__brand-name` styled in DM Serif italic, (3) `.theme-corner` div is removed, (4) ThemeToggle moves into `.sidebar__footer` above the user row, (5) topbar brand loses the emoji.

```html
<template>
  <div class="app-layout">

    <!-- Overlay mobile -->
    <div
      v-if="sidebarOpen"
      class="sidebar-overlay"
      @click="sidebarOpen = false"
    />

    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'sidebar--open': sidebarOpen }">
      <!-- Brand -->
      <div class="sidebar__brand">
        <div class="sidebar__brand-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
          </svg>
        </div>
        <span class="sidebar__brand-name">Agro Manager</span>
      </div>

      <!-- Conta ativa -->
      <AccountSwitcher />

      <!-- Navegação principal -->
      <nav class="sidebar__nav">
        <button
          v-for="item in navItems"
          :key="item.name"
          class="sidebar__nav-item"
          :class="{ 'sidebar__nav-item--active': isActive(item.name) }"
          @click="navigate(item.name)"
        >
          <span class="sidebar__nav-icon" v-html="item.icon" />
          <span>{{ item.label }}</span>
        </button>
      </nav>

      <!-- Rodapé da sidebar -->
      <div class="sidebar__footer">
        <div class="sidebar__footer-theme">
          <ThemeToggle />
        </div>

        <button class="sidebar__user" @click="navigate('settings-profile')">
          <div class="sidebar__user-avatar">
            <img
              v-if="userStore.profile?.avatarUrl"
              :src="userStore.profile.avatarUrl"
              :alt="userStore.profile.name"
            />
            <span v-else class="sidebar__user-initials">{{ userStore.initials }}</span>
          </div>
          <div class="sidebar__user-info">
            <span class="sidebar__user-name">{{ userStore.firstName }}</span>
            <span class="sidebar__user-label">Ver perfil</span>
          </div>
        </button>

        <button class="sidebar__nav-item sidebar__nav-item--danger" @click="logout">
          <span class="sidebar__nav-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </span>
          <span>Sair</span>
        </button>
      </div>
    </aside>

    <!-- Área principal -->
    <div class="app-main">
      <!-- Topbar mobile -->
      <header class="topbar">
        <button class="topbar__menu-btn" @click="sidebarOpen = true" aria-label="Abrir menu">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <span class="topbar__brand">Agro Manager</span>
        <ThemeToggle />
      </header>

      <!-- Conteúdo da rota -->
      <main class="app-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Replace the entire `<style scoped>` block**

```html
<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background: var(--color-background);
}

/* ── Sidebar ──────────────────────────────────────────────────────────────── */

.sidebar {
  width: 220px;
  flex-shrink: 0;
  background: var(--color-card);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  padding: 1.5rem 0.875rem 1.25rem;
  gap: 0.25rem;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.sidebar__brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 0.375rem;
  margin-bottom: 1.25rem;
}

.sidebar__brand-icon {
  width: 28px;
  height: 28px;
  background: var(--color-primary);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary-light);
  flex-shrink: 0;
}

.sidebar__brand-name {
  font-family: 'DM Serif Display', serif;
  font-style: italic;
  font-size: 1.05rem;
  color: var(--color-text);
  letter-spacing: -0.01em;
  line-height: 1;
}

.sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.sidebar__nav-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.575rem 0.625rem;
  border: none;
  border-left: 2px solid transparent;
  border-radius: var(--radius-sm);
  background: none;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
  text-align: left;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.sidebar__nav-item:hover {
  background: var(--color-surface);
  color: var(--color-text);
}

.sidebar__nav-item--active {
  background: var(--color-primary-light);
  color: var(--color-primary);
  border-left-color: var(--color-primary);
  font-weight: 600;
}

.sidebar__nav-item--danger:hover {
  background: var(--color-error-light);
  color: var(--color-error);
}

.sidebar__nav-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.sidebar__footer {
  padding-top: 0.875rem;
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 0.5rem;
}

.sidebar__footer-theme {
  padding: 0 0.375rem 0.25rem;
}

/* ── Área principal ───────────────────────────────────────────────────────── */

.app-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.app-content {
  flex: 1;
}

/* ── Topbar (mobile only) ─────────────────────────────────────────────────── */

.topbar {
  display: none;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  background: var(--color-card);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 10;
}

.topbar__menu-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text);
  display: flex;
  align-items: center;
  padding: 0;
}

.topbar__brand {
  font-family: 'DM Serif Display', serif;
  font-style: italic;
  font-size: 1rem;
  color: var(--color-text);
  letter-spacing: -0.01em;
}

/* ── Overlay mobile ───────────────────────────────────────────────────────── */

.sidebar-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 19;
}

/* ── Responsividade ───────────────────────────────────────────────────────── */

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    z-index: 20;
    transform: translateX(-100%);
    transition: transform 0.25s ease;
  }

  .sidebar--open {
    transform: translateX(0);
  }

  .sidebar-overlay {
    display: block;
  }

  .topbar {
    display: flex;
  }
}

.sidebar__user {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.5rem 0.625rem;
  border: none;
  border-radius: var(--radius-sm);
  background: none;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: background 0.15s;
}

.sidebar__user:hover {
  background: var(--color-surface);
}

.sidebar__user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
  background: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar__user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sidebar__user-initials {
  font-family: 'DM Serif Display', serif;
  font-size: 0.7rem;
  color: #e8f4ed;
}

.sidebar__user-info {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
  min-width: 0;
}

.sidebar__user-name {
  font-size: 0.825rem;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar__user-label {
  font-size: 0.68rem;
  color: var(--color-text-muted);
}
</style>
```

- [ ] **Step 3: Verify in browser**

Navigate to any authenticated route. Check:
- Sidebar brand shows a dark square icon with leaf SVG + "Agro Manager" in italic serif
- Active nav item has a green left border + green text + light green background
- ThemeToggle appears at the bottom of sidebar (desktop) and in topbar (mobile/narrow window)
- No floating toggle button in the top-right corner
- Hover state on nav items uses `var(--color-surface)` (slightly warm tinted)

- [ ] **Step 4: Commit**

```bash
git add src/layouts/AppLayout.vue
git commit -m "feat: redesign sidebar with Field Premium aesthetic and serif brand"
```

---

## Task 3: AuthLayout — Auth Layout Redesign

**Files:**
- Modify: `src/layouts/AuthLayout.vue`

- [ ] **Step 1: Replace the `<template>` block**

```html
<template>
  <div class="auth-split">

    <!-- ── Painel esquerdo — apresentação ─────────────────────── -->
    <div class="auth-panel auth-panel--left">

      <!-- Decoração botânica SVG (fundo, 6% opacidade) -->
      <svg class="panel-botanical" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M100 180 C60 160 20 130 20 90 C20 50 60 30 100 20 C140 30 180 50 180 90 C180 130 140 160 100 180Z" stroke="white" stroke-width="1" fill="none"/>
        <path d="M100 20 Q130 60 100 100 Q70 60 100 20" stroke="white" stroke-width="0.8" fill="none"/>
        <path d="M20 90 Q60 70 100 100 Q60 130 20 90" stroke="white" stroke-width="0.8" fill="none"/>
        <path d="M180 90 Q140 70 100 100 Q140 130 180 90" stroke="white" stroke-width="0.8" fill="none"/>
        <path d="M100 180 Q70 140 100 100 Q130 140 100 180" stroke="white" stroke-width="0.8" fill="none"/>
      </svg>

      <!-- Marca -->
      <div class="panel-brand">
        <div class="panel-brand__icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6dbf99" stroke-width="2.5">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
          </svg>
        </div>
        <span class="panel-brand__name">Agro Manager</span>
      </div>

      <!-- Headline -->
      <div class="panel-hero">
        <h1 class="panel-hero__title">
          Gerencie suas lavouras<br>
          com <em class="panel-hero__em">inteligência</em>
        </h1>
        <p class="panel-hero__desc">
          Controle financeiro, histórico de atividades e previsão do tempo — tudo em um único lugar para o produtor de melancia.
        </p>
      </div>

      <!-- Features -->
      <div class="panel-features">
        <div v-for="f in features" :key="f.title" class="feature-item">
          <div class="feature-item__icon" v-html="f.icon" />
          <div class="feature-item__text">
            <span class="feature-item__title">{{ f.title }}</span>
            <span class="feature-item__desc">{{ f.desc }}</span>
          </div>
        </div>
      </div>

      <!-- Rodapé do painel -->
      <p class="panel-footer">
        © {{ new Date().getFullYear() }} Agro Manager
      </p>

    </div>

    <!-- ── Painel direito — formulário ───────────────────────── -->
    <div class="auth-panel auth-panel--right">

      <!-- Toggle de tema -->
      <div class="auth-toolbar">
        <ThemeToggle />
      </div>

      <!-- Marca mobile (oculta no desktop) -->
      <div class="mobile-brand">
        <span class="mobile-brand__name">Agro Manager</span>
      </div>

      <!-- Card do formulário -->
      <div class="auth-card">
        <RouterView />
      </div>

    </div>

  </div>
</template>
```

- [ ] **Step 2: Replace the entire `<style scoped>` block**

```html
<style scoped>
/* ── Layout split-screen ────────────────────────────────────────── */
.auth-split {
  min-height: 100vh;
  display: flex;
}

/* ── Painel esquerdo ────────────────────────────────────────────── */
.auth-panel--left {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 3rem 3.5rem;
  background: #1b3a2d;
  position: relative;
  overflow: hidden;
}

/* Botânica SVG de fundo */
.panel-botanical {
  position: absolute;
  top: 50%;
  right: 3rem;
  transform: translateY(-50%);
  width: 280px;
  height: 280px;
  opacity: 0.06;
  pointer-events: none;
}

/* ── Marca ──────────────────────────────────────────────────────── */
.panel-brand {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  position: relative;
  z-index: 1;
}

.panel-brand__icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.panel-brand__name {
  font-family: 'DM Serif Display', serif;
  font-style: italic;
  font-size: 1.2rem;
  color: #e8f0ea;
  letter-spacing: -0.01em;
}

/* ── Hero ───────────────────────────────────────────────────────── */
.panel-hero {
  position: relative;
  z-index: 1;
}

.panel-hero__title {
  font-family: 'DM Serif Display', serif;
  font-size: 2rem;
  font-weight: 400;
  color: #e8f0ea;
  letter-spacing: -0.02em;
  line-height: 1.25;
  margin-bottom: 1rem;
}

.panel-hero__em {
  font-style: italic;
  color: #c9a96e;
}

.panel-hero__desc {
  font-size: 0.9375rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.65;
  max-width: 380px;
}

/* ── Features ───────────────────────────────────────────────────── */
.panel-features {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  position: relative;
  z-index: 1;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
}

.feature-item__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: #6dbf99;
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.feature-item__text {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.feature-item__title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #e8f0ea;
}

.feature-item__desc {
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.5;
}

/* ── Rodapé do painel ───────────────────────────────────────────── */
.panel-footer {
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.4);
  position: relative;
  z-index: 1;
}

/* ── Painel direito ─────────────────────────────────────────────── */
.auth-panel--right {
  width: 480px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2.5rem;
  background: var(--color-background);
  position: relative;
}

.auth-toolbar {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
}

/* Marca mobile — oculta no desktop */
.mobile-brand {
  display: none;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.mobile-brand__name {
  font-family: 'DM Serif Display', serif;
  font-style: italic;
  font-size: 1.125rem;
  color: var(--color-text);
  letter-spacing: -0.01em;
}

/* Card do formulário */
.auth-card {
  width: 100%;
  max-width: 400px;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-elevated);
  padding: 2.5rem;
}

/* ── Responsividade ─────────────────────────────────────────────── */

@media (max-width: 1024px) {
  .auth-panel--left {
    padding: 2.5rem 2.5rem;
  }
  .panel-hero__title { font-size: 1.625rem; }
  .auth-panel--right {
    width: 420px;
    padding: 2.5rem 2rem;
  }
}

@media (max-width: 768px) {
  .auth-split {
    flex-direction: column;
  }
  .auth-panel--left {
    display: none;
  }
  .auth-panel--right {
    width: 100%;
    min-height: 100vh;
    padding: 3rem 1.5rem 2rem;
    justify-content: flex-start;
    padding-top: 4rem;
  }
  .mobile-brand {
    display: flex;
  }
  .auth-card {
    max-width: 100%;
  }
}

@media (max-width: 480px) {
  .auth-card {
    padding: 2rem 1.5rem;
    border-radius: var(--radius-md);
  }
}
</style>
```

- [ ] **Step 3: Verify in browser**

Navigate to `/auth/login`. Check:
- Left panel: "Agro Manager" in italic serif, hero title "com *inteligência*" with italic golden em, subtle botanical SVG visible behind content
- Right panel: auth card with rounded corners and elevated shadow on warm cream background
- Mobile (< 768px): left panel hidden, brand shows as italic serif

- [ ] **Step 4: Commit**

```bash
git add src/layouts/AuthLayout.vue
git commit -m "feat: redesign auth layout with serif brand, botanical decoration, and accent em"
```

---

## Task 4: DashboardView — Typography + Finance Card + Badge Colors

**Files:**
- Modify: `src/views/DashboardView.vue`

- [ ] **Step 1: Update dashboard title and section title styles**

In the `<style scoped>` block, replace these rules:

Replace:
```css
.dashboard__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
}
```
With:
```css
.dashboard__title {
  font-family: 'DM Serif Display', serif;
  font-size: 1.75rem;
  font-weight: 400;
  color: var(--color-text);
  letter-spacing: -0.02em;
  line-height: 1.2;
}
```

Replace:
```css
.section__title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 1rem;
  letter-spacing: -0.01em;
}
```
With:
```css
.section__title {
  font-family: 'DM Serif Display', serif;
  font-size: 1.05rem;
  font-weight: 400;
  color: var(--color-text);
  margin-bottom: 1rem;
  letter-spacing: -0.01em;
}
```

Replace:
```css
.metric-card__value {
  font-size: 1.625rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.03em;
  line-height: 1;
}
```
With:
```css
.metric-card__value {
  font-family: 'DM Serif Display', serif;
  font-size: 1.75rem;
  font-weight: 400;
  color: var(--color-text);
  letter-spacing: -0.02em;
  line-height: 1;
}
```

Replace:
```css
.metric-card__value--sm { 
  font-size: 1.1rem; 
  letter-spacing: -0.01em; 
}
```
With:
```css
.metric-card__value--sm {
  font-family: 'DM Serif Display', serif;
  font-size: 1.15rem;
  font-weight: 400;
  letter-spacing: -0.01em;
}
```

- [ ] **Step 2: Replace hardcoded icon background colors with tokens**

In the `<style scoped>` block, replace:
```css
.metric-card__icon--green   { background: #d1fae5; color: #059669; }
.metric-card__icon--blue    { background: #dbeafe; color: #2563eb; }
.metric-card__icon--primary { background: var(--color-primary-light); color: var(--color-primary); }
.metric-card__icon--warning { background: var(--color-warning-light); color: var(--color-warning); }
.metric-card__icon--muted   { background: var(--color-background); color: var(--color-text-muted); }
```
With:
```css
.metric-card__icon--green   { background: var(--color-success-light); color: var(--color-success); }
.metric-card__icon--blue    { background: var(--color-info-light);    color: var(--color-info); }
.metric-card__icon--primary { background: var(--color-primary-light); color: var(--color-primary); }
.metric-card__icon--warning { background: var(--color-warning-light); color: var(--color-warning); }
.metric-card__icon--muted   { background: var(--color-surface);       color: var(--color-text-muted); }
```

Also remove the duplicate rule at the bottom of `<style scoped>`:
```css
.metric-card__icon--warning {
  background: #fef3c7;
  color: #d97706;
}
```
(This rule at the end overrides the one above — delete it entirely.)

- [ ] **Step 3: Replace finance card with dark inverted design**

In the `<style scoped>` block, replace the entire finance card section:

Replace:
```css
.finance-card {
  background: var(--color-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  padding: 1.25rem;
}

.finance-card__totals {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.finance-total {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.finance-total__label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.finance-total__value {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
  word-break: break-word;
}

.finance-total--paid    .finance-total__value { color: #059669; }
.finance-total--pending .finance-total__value { color: var(--color-warning); }

.finance-card__progress { display: flex; align-items: center; gap: 0.875rem; }

.finance-bar-track {
  flex: 1;
  height: 8px;
  background: var(--color-background);
  border-radius: 4px;
  overflow: hidden;
}

.finance-bar-fill {
  height: 100%;
  background: #059669;
  border-radius: 4px;
  transition: width 0.6s ease;
}

.finance-bar-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #059669;
  white-space: nowrap;
}

.finance-card__empty {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  text-align: center;
  padding: 0.5rem 0;
}
```

With:
```css
/* Finance card — dark inverted surface, always forest green background */
.finance-card {
  background: #1b3a2d;
  border-radius: var(--radius-md);
  padding: 1.25rem 1.5rem;
}

.finance-card__totals {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.finance-total {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.finance-total__label {
  font-size: 0.68rem;
  font-weight: 700;
  color: rgba(109, 191, 153, 0.75);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.finance-total__value {
  font-family: 'DM Serif Display', serif;
  font-size: 1.35rem;
  font-weight: 400;
  color: #e8f0ea;
  letter-spacing: -0.01em;
  word-break: break-word;
}

.finance-total--paid    .finance-total__value { color: #6dbf99; }
.finance-total--pending .finance-total__value { color: #c9a96e; }

.finance-card__progress { display: flex; align-items: center; gap: 0.875rem; }

.finance-bar-track {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.finance-bar-fill {
  height: 100%;
  background: #6dbf99;
  border-radius: 2px;
  transition: width 0.6s ease;
}

.finance-bar-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #6dbf99;
  white-space: nowrap;
}

.finance-card__empty {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  padding: 0.5rem 0;
}
```

- [ ] **Step 4: Replace hardcoded paid/success colors with tokens**

In the `<style scoped>` block, replace:
```css
.paid-badge {
  display: inline-flex;
  padding: 0.15rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  background: #d1fae5;
  color: #059669;
}
```
With:
```css
.paid-badge {
  display: inline-flex;
  padding: 0.15rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  background: var(--color-success-light);
  color: var(--color-success);
}
```

- [ ] **Step 5: Update metric card border and table styles**

Replace:
```css
.metric-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--color-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
}
```
With:
```css
.metric-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
}
```

Replace:
```css
.table-wrapper {
  background: var(--color-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}
```
With:
```css
.table-wrapper {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}
```

Replace:
```css
.farms-table thead { background: var(--color-background); }
```
With:
```css
.farms-table thead { background: var(--color-surface); }
```

- [ ] **Step 6: Verify in browser**

Navigate to the Dashboard. Check:
- "Dashboard" title renders in DM Serif Display (elegant serif, not sans-serif)
- Section titles "Resumo financeiro", "Distribuição por status", "Lavouras recentes" render in serif
- Metric values (numbers like 12, 7, etc.) render in DM Serif Display
- Finance card shows dark forest green background with light text, sage progress bar
- Status badges use correct token colors (warning = brown-amber, info = blue, success = forest green)
- Table header background is slightly warm (surface, not pure white)

- [ ] **Step 7: Commit**

```bash
git add src/views/DashboardView.vue
git commit -m "feat: apply Field Premium typography and dark finance card to dashboard"
```

---

## Task 5: Auth Forms — Fix Hardcoded Focus Ring

**Files:**
- Modify: `src/views/auth/LoginView.vue`
- Modify: `src/views/auth/RegisterView.vue`

- [ ] **Step 1: Fix focus ring in `LoginView.vue`**

In `src/views/auth/LoginView.vue`, in the `<style scoped>` block, replace:
```css
.form-input:focus {
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 3px rgba(0, 189, 126, 0.12);
}
```
With:
```css
.form-input:focus {
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 3px rgba(27, 58, 45, 0.1);
  background: var(--color-card);
}
```

Also update the login title to use serif:
Replace:
```css
.login__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
  line-height: 1.3;
}
```
With:
```css
.login__title {
  font-family: 'DM Serif Display', serif;
  font-size: 1.5rem;
  font-weight: 400;
  color: var(--color-text);
  letter-spacing: -0.02em;
  line-height: 1.3;
}
```

- [ ] **Step 2: Fix focus ring in `RegisterView.vue`**

In `src/views/auth/RegisterView.vue`, in the `<style scoped>` block, replace:
```css
.form-input:focus {
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 3px rgba(0, 189, 126, 0.12);
}
```
With:
```css
.form-input:focus {
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 3px rgba(27, 58, 45, 0.1);
  background: var(--color-card);
}
```

Also update the register title to use serif:
Replace:
```css
.register__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
  line-height: 1.3;
}
```
With:
```css
.register__title {
  font-family: 'DM Serif Display', serif;
  font-size: 1.5rem;
  font-weight: 400;
  color: var(--color-text);
  letter-spacing: -0.02em;
  line-height: 1.3;
}
```

- [ ] **Step 3: Verify in browser**

Navigate to `/auth/login`. Check:
- "Acesse sua conta" title renders in DM Serif Display
- Click into the email input field — focus ring should be a subtle dark green glow (not the old bright mint green)
- Navigate to `/auth/register` — same checks apply, "Criar conta" in serif

- [ ] **Step 4: Commit**

```bash
git add src/views/auth/LoginView.vue src/views/auth/RegisterView.vue
git commit -m "feat: update auth form titles to serif and fix focus ring to Field Premium color"
```

---

## Task 6: Final Verification

- [ ] **Step 1: Full visual audit — Light Mode**

Start dev server, open http://localhost:5173. Go through each route:
- `/auth/login` — serif title, warm cream bg, dark green button, refined focus ring
- `/auth/register` — same
- `/dashboard` — serif page title + metric values, dark finance card, token-colored badges
- Any other route — nav sidebar shows refined brand, left-border active indicator, ThemeToggle in footer

- [ ] **Step 2: Full visual audit — Dark Mode**

Click the ThemeToggle in sidebar footer (desktop) or topbar (mobile). Check:
- Background turns to deep forest `#0e1612`
- Cards turn to `#182318` (dark moss)
- Borders are `#2d4a38` (dark green border)
- Sidebar brand and nav items remain readable
- Finance card still has the `#1b3a2d` background (slightly lighter than the dark bg — visible as a card surface)
- Focus ring on inputs changes to sage glow

- [ ] **Step 3: Check no undefined CSS variables**

Open browser DevTools → Console. Search for any warnings about undefined CSS variables (none expected if spec was followed correctly).

Also verify `--color-warning`, `--color-info`, `--color-success` and their `-light` variants are applied by checking the dashboard status badges — each status color should look correct and readable.

- [ ] **Step 4: Final commit and tag**

```bash
git add -A
git status
git commit -m "feat: complete Field Premium design system refresh

- DM Serif Display + DM Sans typography
- Forest green + warm cream token palette
- Refined sidebar with serif italic brand and left-border active indicator  
- Auth layout with botanical decoration and accent em
- Dashboard with dark finance card and token-aligned colors
- All missing tokens (warning, info, success) now defined

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```
