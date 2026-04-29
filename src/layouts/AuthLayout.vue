<script setup lang="ts">
import { RouterView } from 'vue-router'
import ThemeToggle from '@/components/ThemeToggle.vue'

// Funcionalidades destacadas no painel de apresentação
const features = [
  {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`,
    title: 'Gestão de lavouras',
    desc: 'Acompanhe todas as suas lavouras de melancia com status em tempo real.',
  },
  {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
    title: 'Controle financeiro',
    desc: 'Registre despesas, acompanhe pagamentos e gere relatórios com exportação para Excel.',
  },
  {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    title: 'Histórico completo',
    desc: 'Acompanhe todas as atividades e alterações de cada lavoura com registro automático.',
  },
  {
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    title: 'Trabalho em equipe',
    desc: 'Adicione membros à sua conta com diferentes níveis de acesso.',
  },
]
</script>

<template>
  <div class="auth-split">

    <!-- ── Painel esquerdo — apresentação ─────────────────────── -->
    <div class="auth-panel auth-panel--left">

      <!-- Marca -->
      <div class="panel-brand">
        <span class="panel-brand__icon">🌱</span>
        <span class="panel-brand__name">Agro Manager</span>
      </div>

      <!-- Headline -->
      <div class="panel-hero">
        <h1 class="panel-hero__title">
          Gerencie suas lavouras com inteligência
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
        <span>🌱</span>
        <span class="mobile-brand__name">Agro Manager</span>
      </div>

      <!-- Card do formulário -->
      <div class="auth-card">
        <RouterView />
      </div>

    </div>

  </div>
</template>

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
  background: #1a3d2b;
  position: relative;
  overflow: hidden;
}

/* Detalhe decorativo de fundo — círculos sutis */
.auth-panel--left::before {
  content: '';
  position: absolute;
  top: -120px;
  right: -120px;
  width: 380px;
  height: 380px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  pointer-events: none;
}

.auth-panel--left::after {
  content: '';
  position: absolute;
  bottom: -80px;
  left: -80px;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.04);
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

.panel-brand__icon { font-size: 1.625rem; }

.panel-brand__name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.02em;
}

/* ── Hero ───────────────────────────────────────────────────────── */
.panel-hero {
  position: relative;
  z-index: 1;
}

.panel-hero__title {
  font-size: 2rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.03em;
  line-height: 1.25;
  margin-bottom: 1rem;
}

.panel-hero__desc {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.8);
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
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.feature-item__text {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.feature-item__title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #fff;
}

.feature-item__desc {
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
}

/* ── Rodapé do painel ───────────────────────────────────────────── */
.panel-footer {
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.5);
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
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text);
}

.mobile-brand__name { letter-spacing: -0.02em; }

/* Card do formulário */
.auth-card {
  width: 100%;
  max-width: 400px;
  background: var(--color-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: 2.5rem;
}

/* ── Responsividade ─────────────────────────────────────────────── */

/* Tablet — painel esquerdo mais compacto */
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

/* Mobile — colapsa para coluna única, painel esquerdo some */
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