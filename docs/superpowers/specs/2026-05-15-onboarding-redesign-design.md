# Onboarding Redesign — Design Spec

**Data:** 2026-05-15
**Escopo:** `src/layouts/OnboardingLayout.vue` + `src/views/onboarding/OnboardingView.vue`
**Abordagem escolhida:** Refinamento elegante — máximo impacto visual com mínima mudança estrutural

---

## Problema

A tela de onboarding atual tem fundo cinza neutro (`#f9fafb`), ícone de marca como texto simples e cards de opção sem diferenciação visual clara entre ativo e desabilitado. O resultado é uma tela funcional mas sem personalidade ou acolhimento.

---

## Objetivo

Tornar o onboarding visualmente mais amigável e memorável, reforçando a identidade verde esmeralda do Agro Manager, sem alterar a estrutura de componentes nem a lógica de navegação.

---

## Design

### 1. Fundo — Gradiente com blobs decorativos

**Light mode:**
- Background: gradiente diagonal `160deg` de `#f0fdf4` → `#ecfdf5` → `#d1fae5`
- 3 blobs (círculos com `filter: blur`) posicionados estrategicamente:
  - Blob 1: canto superior direito, 180×180px, `rgba(5,150,105, 0.13)`, blur 30px
  - Blob 2: canto inferior esquerdo, 140×140px, `rgba(217,119,6, 0.10)`, blur 22px
  - Blob 3: lateral esquerda (alto), 60×60px, `rgba(5,150,105, 0.07)`, blur 12px

**Dark mode:**
- Background: gradiente `160deg` de `#0f172a` → `#0f2419` → `#022c22`
- Blobs adaptados: verde `rgba(52,211,153, 0.10)` e amber `rgba(251,191,36, 0.07)`

Os blobs são elementos puramente decorativos (`pointer-events: none`, `position: absolute`, `z-index: 0`). O conteúdo fica em `z-index: 1`.

---

### 2. Ícone da marca — Container elevado

Substituir o bloco `onboarding-brand` atual (emoji + texto em linha) por:

- Container `72×72px`, `border-radius: 20px`
- Background: gradiente `135deg` de `#059669` → `#10b981`
- Sombra colorida: `0 8px 28px rgba(5,150,105, 0.38)` (light) / `0 8px 28px rgba(52,211,153, 0.30)` (dark)
- Emoji 🌱 centralizado, `font-size: 2rem`
- Posicionado acima do título, centralizado, dentro de `.onboarding-content` (não mais no layout)

O nome "Agro Manager" é removido do bloco de marca — o título da view já cumpre esse papel.

---

### 3. Cards de opção — Diferenciação visual clara

**Card ativo (`Criar nova conta`):**
- `border: 1.5px solid var(--color-primary)` (verde no light, `#34d399` no dark)
- `box-shadow: 0 4px 16px rgba(5,150,105, 0.18)` (light) / `rgba(52,211,153, 0.15)` (dark)
- Ícone: fundo `var(--color-primary-light)` (`#d1fae5` light / `#022c22` dark), ícone em `var(--color-primary)`
- Seta: cor `var(--color-primary)`

**Card desabilitado (`Usar um convite`):**
- `border: 1px solid var(--color-border)` — sem alteração
- `opacity: 0.5` (era `0.55` — ajuste mínimo para melhor leitura)
- Ícone: fundo `var(--color-surface)`, cor `var(--color-text-muted)`
- Badge "Em breve": sem alteração

**Ambos os cards:**
- `border-radius: var(--radius-lg)` (16px) — mantém o token existente
- `padding: 1rem 1.125rem` (era `1.5rem` — leve redução para proporcionar melhor com o ícone maior acima)

---

### 4. Toolbar — Fundo semi-transparente

Os botões "Sair" e `ThemeToggle` recebem fundo semi-transparente para não conflitar com o gradiente:

**Light:** `background: rgba(255,255,255, 0.70)`, `border: 1px solid rgba(5,150,105, 0.20)`
**Dark:** `background: rgba(30,41,59, 0.70)`, `border: 1px solid var(--color-border)`

Isso garante legibilidade sobre o gradiente sem criar um elemento opaco que quebre o visual.

---

### 5. Texto do header

- Título: sem alteração de conteúdo ou estilo tipográfico — apenas o ícone de marca agora fica acima dele na view
- Subtítulo: max-width reduz de `420px` para `280px` para melhor proporção com o container mais compacto

---

## Mudanças por arquivo

### `OnboardingLayout.vue`
- Fundo do `.onboarding-wrapper`: substituir `background: var(--color-background)` pelo gradiente + blobs
- `.onboarding-brand`: remover bloco (emoji + nome em linha) — ícone migra para a view
- `.onboarding-toolbar` botões: adicionar fundo semi-transparente
- Adicionar os 3 elementos blob como `<div>` absolutos dentro de `.onboarding-wrapper`

### `OnboardingView.vue`
- Adicionar bloco de ícone (`brand-icon`) acima do `.onboarding__header`
- `.option-card.active` (primeiro card): adicionar borda e sombra verde
- `.option-card__icon--primary`: manter fundo `var(--color-primary-light)`, já correto
- `.option-card--disabled`: ajustar opacity de `0.55` para `0.5`
- Reduzir `padding` dos cards de `1.5rem` para `1rem 1.125rem`
- `.onboarding__subtitle`: reduzir `max-width` de `420px` para `280px`

---

## O que não muda

- Estrutura de rotas e navegação
- Lógica de `router.push` no card ativo
- Tokens de cor existentes (todos reutilizados — sem novos tokens)
- Responsividade mobile (breakpoint `480px` mantido)
- `ThemeToggle` e botão "Sair" — apenas o estilo do container muda

---

## Critérios de sucesso

- Visual claramente mais acolhedor que o atual em ambos os modos
- Sem regressões: navegação para `create-account` funciona, card de convite permanece desabilitado
- Dark mode coerente com light mode
- Nenhum novo token de CSS criado — apenas uso dos existentes
