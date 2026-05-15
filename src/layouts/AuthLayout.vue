<script setup lang="ts">
import { RouterView } from 'vue-router'
import ThemeToggle from '@/components/ThemeToggle.vue'
import SvgIcon from '@/components/SvgIcon.vue'
import type { IconName } from '@/components/SvgIcon.vue'

// Funcionalidades destacadas no painel de apresentação
const features: Array<{ icon: IconName; title: string; desc: string }> = [
  {
    icon: 'leaf',
    title: 'Gestão de lavouras',
    desc: 'Acompanhe todas as suas lavouras de melancia com status em tempo real.',
  },
  {
    icon: 'money',
    title: 'Controle financeiro',
    desc: 'Registre despesas, acompanhe pagamentos e gere relatórios com exportação para Excel.',
  },
  {
    icon: 'clock',
    title: 'Histórico completo',
    desc: 'Acompanhe todas as atividades e alterações de cada lavoura com registro automático.',
  },
  {
    icon: 'users',
    title: 'Trabalho em equipe',
    desc: 'Adicione membros à sua conta com diferentes níveis de acesso.',
  },
]
</script>

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
          <div class="feature-item__icon">
            <SvgIcon :name="f.icon" />
          </div>
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
  font-size: 1.25rem;
  color: #e8f0ea;
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
  font-size: 1rem;
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
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.5;
}

/* ── Rodapé do painel ───────────────────────────────────────────── */
.panel-footer {
  font-size: 0.875rem;
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
  font-size: 1.125rem;
  color: var(--color-text);
  letter-spacing: -0.02em;
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

/* Tablet — painel esquerdo mais compacto */
@media (max-width: 1024px) {
  .auth-panel--left {
    padding: 2.5rem 2.5rem;
  }

  .panel-hero__title { font-size: 1.5rem; }

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
