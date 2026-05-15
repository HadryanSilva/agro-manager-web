# Onboarding Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesenhar visualmente a tela de Onboarding para ser mais acolhedora, aplicando gradiente com blobs decorativos, ícone de marca elevado e cards com diferenciação visual clara.

**Architecture:** Mudanças puramente de template e CSS em dois arquivos Vue existentes — sem alterações de lógica, rotas ou design tokens. Todos os valores de cor usam variáveis CSS já definidas em `src/assets/base.css`.

**Tech Stack:** Vue 3 (Composition API), CSS scoped, design tokens em CSS custom properties.

---

## Arquivos modificados

| Arquivo | O que muda |
|---|---|
| `src/layouts/OnboardingLayout.vue` | Fundo: gradiente + blobs; toolbar: semi-transparente; remove bloco `.onboarding-brand` |
| `src/views/onboarding/OnboardingView.vue` | Adiciona ícone de marca elevado; ajusta cards (borda/sombra ativo, opacity desabilitado, padding, max-width subtitle) |

---

## Task 1: OnboardingLayout — Gradiente de fundo e blobs decorativos

**Arquivo:** `src/layouts/OnboardingLayout.vue`

- [ ] **Step 1: Adicionar os 3 blobs no template**

Localizar o elemento raiz `.onboarding-wrapper` e inserir os blobs como primeiros filhos (antes da toolbar):

```html
<div class="onboarding-wrapper">

  <!-- Blobs decorativos -->
  <div class="blob blob-1" aria-hidden="true"></div>
  <div class="blob blob-2" aria-hidden="true"></div>
  <div class="blob blob-3" aria-hidden="true"></div>

  <!-- Toolbar fixa: logout à esquerda, theme toggle à direita -->
  <div class="onboarding-toolbar">
```

- [ ] **Step 2: Substituir o background do `.onboarding-wrapper`**

No bloco `<style scoped>`, localizar:

```css
.onboarding-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  background: var(--color-background);
}
```

Substituir por:

```css
.onboarding-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  background: linear-gradient(160deg, #f0fdf4 0%, #ecfdf5 55%, #d1fae5 100%);
  position: relative;
  overflow: hidden;
}

[data-theme="dark"] .onboarding-wrapper {
  background: linear-gradient(160deg, #0f172a 0%, #0f2419 55%, #022c22 100%);
}
```

- [ ] **Step 3: Adicionar estilos dos blobs**

Após o bloco `.onboarding-wrapper`, inserir:

```css
/* ── Blobs decorativos ── */
.blob {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}

.blob-1 {
  top: -60px;
  right: -60px;
  width: 220px;
  height: 220px;
  background: rgba(5, 150, 105, 0.13);
  filter: blur(30px);
}

.blob-2 {
  bottom: -50px;
  left: -50px;
  width: 170px;
  height: 170px;
  background: rgba(217, 119, 6, 0.10);
  filter: blur(22px);
}

.blob-3 {
  top: 100px;
  left: 30px;
  width: 70px;
  height: 70px;
  background: rgba(5, 150, 105, 0.07);
  filter: blur(12px);
}

[data-theme="dark"] .blob-1 { background: rgba(52, 211, 153, 0.10); }
[data-theme="dark"] .blob-2 { background: rgba(251, 191, 36, 0.07); }
[data-theme="dark"] .blob-3 { background: rgba(52, 211, 153, 0.05); }
```

- [ ] **Step 4: Garantir que o conteúdo fica acima dos blobs**

Localizar `.onboarding-toolbar`, `.onboarding-brand` e `.onboarding-content` e adicionar `position: relative; z-index: 1;` em cada um. Exemplo para toolbar (já tem `position: fixed` — apenas adicionar `z-index`):

```css
.onboarding-toolbar {
  position: fixed;
  top: 1.25rem;
  left: 1.25rem;
  right: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  pointer-events: none;
  z-index: 10;
}

.onboarding-content {
  width: 100%;
  max-width: 680px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}
```

- [ ] **Step 5: Verificar visualmente no navegador**

Abrir `http://localhost:5173` (ou porta configurada). Verificar:
- Fundo com gradiente verde suave no light mode
- Blobs visíveis nos cantos (sem bloquear cliques)
- Conteúdo centralizado sem deslocamento

- [ ] **Step 6: Commit**

```bash
git add src/layouts/OnboardingLayout.vue
git commit -m "feat: add gradient background and decorative blobs to OnboardingLayout"
```

---

## Task 2: OnboardingLayout — Toolbar semi-transparente e remoção do bloco de marca

**Arquivo:** `src/layouts/OnboardingLayout.vue`

- [ ] **Step 1: Atualizar estilo do botão logout**

Localizar o bloco `.logout-btn` e substituir por:

```css
.logout-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.4rem 0.875rem;
  border: 1px solid rgba(5, 150, 105, 0.20);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.70);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}

.logout-btn:hover {
  border-color: var(--color-error);
  color: var(--color-error);
  background: var(--color-error-light);
}

[data-theme="dark"] .logout-btn {
  background: rgba(30, 41, 59, 0.70);
  border-color: var(--color-border);
}
```

- [ ] **Step 2: Remover o bloco `.onboarding-brand` do template**

Localizar e remover completamente do template:

```html
<!-- Brand centralizada -->
<div class="onboarding-brand">
  <span class="onboarding-brand__icon">🌱</span>
  <span class="onboarding-brand__name">Agro Manager</span>
</div>
```

- [ ] **Step 3: Remover os estilos de `.onboarding-brand` do CSS**

Localizar e remover os blocos:

```css
.onboarding-brand { ... }
.onboarding-brand__icon { ... }
.onboarding-brand__name { ... }
```

- [ ] **Step 4: Verificar visualmente**

- Botão "Sair" com fundo translúcido sobre o gradiente
- Sem o bloco de marca em linha abaixo da toolbar
- Alternar para dark mode e verificar adaptação da toolbar

- [ ] **Step 5: Commit**

```bash
git add src/layouts/OnboardingLayout.vue
git commit -m "feat: semi-transparent toolbar and remove inline brand block"
```

---

## Task 3: OnboardingView — Ícone de marca elevado e ajuste do header

**Arquivo:** `src/views/onboarding/OnboardingView.vue`

- [ ] **Step 1: Adicionar ícone de marca no template**

Localizar o bloco `.onboarding__header` e inserir o ícone imediatamente antes dele, dentro de `.onboarding`:

```html
<div class="onboarding">

  <!-- Ícone de marca elevado -->
  <div class="onboarding__brand-icon">🌱</div>

  <div class="onboarding__header">
    <h1 class="onboarding__title">Bem-vindo ao Agro Manager</h1>
```

- [ ] **Step 2: Adicionar estilos do ícone**

No `<style scoped>`, antes do bloco `.onboarding__header`, inserir:

```css
.onboarding__brand-icon {
  width: 72px;
  height: 72px;
  background: linear-gradient(135deg, #059669, #10b981);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  box-shadow: 0 8px 28px rgba(5, 150, 105, 0.38);
  margin: 0 auto 1.5rem;
}

[data-theme="dark"] .onboarding__brand-icon {
  box-shadow: 0 8px 28px rgba(52, 211, 153, 0.30);
}
```

- [ ] **Step 3: Ajustar max-width do subtítulo**

Localizar no CSS:

```css
.onboarding__subtitle {
  margin-top: 0.625rem;
  font-size: 1rem;
  color: var(--color-text-muted);
  max-width: 420px;
  margin-inline: auto;
  line-height: 1.6;
}
```

Alterar apenas `max-width`:

```css
.onboarding__subtitle {
  margin-top: 0.625rem;
  font-size: 1rem;
  color: var(--color-text-muted);
  max-width: 280px;
  margin-inline: auto;
  line-height: 1.6;
}
```

- [ ] **Step 4: Verificar visualmente**

- Ícone 🌱 centralizado com fundo gradiente verde e sombra colorida
- Título e subtítulo proporcionais abaixo do ícone
- Dark mode: sombra do ícone adaptada

- [ ] **Step 5: Commit**

```bash
git add src/views/onboarding/OnboardingView.vue
git commit -m "feat: add elevated brand icon and tighten subtitle width in OnboardingView"
```

---

## Task 4: OnboardingView — Refinamento visual dos cards

**Arquivo:** `src/views/onboarding/OnboardingView.vue`

- [ ] **Step 1: Reduzir padding dos cards**

Localizar no CSS:

```css
.option-card {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  width: 100%;
  padding: 1.5rem;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
}
```

Alterar apenas `padding` e `gap`:

```css
.option-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  padding: 1rem 1.125rem;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
}
```

- [ ] **Step 2: Aplicar borda e sombra verde no card ativo**

O card ativo é o primeiro `.option-card` (sem classe `--disabled`). Adicionar seletor no CSS — inserir após o bloco `.option-card`:

```css
.option-card:not(.option-card--disabled) {
  border-color: var(--color-primary);
  box-shadow: 0 4px 16px rgba(5, 150, 105, 0.18);
}

[data-theme="dark"] .option-card:not(.option-card--disabled) {
  box-shadow: 0 4px 16px rgba(52, 211, 153, 0.15);
}
```

- [ ] **Step 3: Atualizar o ícone do card ativo para usar fundo primário claro**

O `.option-card__icon--primary` já usa `var(--color-primary-light)` e `var(--color-primary)` — verificar no CSS que está assim:

```css
.option-card__icon--primary {
  background: var(--color-primary-light);
  color: var(--color-primary);
}
```

Se estiver correto, nenhuma mudança necessária. Se não estiver, corrigir para esses valores.

- [ ] **Step 4: Ajustar opacity do card desabilitado**

Localizar:

```css
.option-card--disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
```

Alterar para:

```css
.option-card--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

- [ ] **Step 5: Verificar visualmente**

Verificar os seguintes pontos no navegador:
- Card "Criar nova conta": borda verde visível, sombra esverdeada
- Hover no card ativo: borda fica mais escura (`var(--color-primary-dark)`), sombra `var(--shadow-card-hover)`, translateY(-1px)
- Card "Usar um convite": claramente acinzentado/apagado
- Dark mode: cores adaptadas via tokens existentes
- Mobile (redimensionar para < 480px): padding e ícone menores ainda corretos

- [ ] **Step 6: Commit final**

```bash
git add src/views/onboarding/OnboardingView.vue
git commit -m "feat: refine option cards — active border/shadow, reduced padding, disabled opacity"
```

---

## Verificação final

Após todos os commits:

- [ ] Abrir o app em light mode e percorrer o fluxo: onboarding → clicar "Criar nova conta" → navegação ocorre normalmente
- [ ] Alternar para dark mode e confirmar que todos os elementos se adaptam
- [ ] Redimensionar para mobile (< 480px) e confirmar ausência de overflow ou quebra de layout
- [ ] Confirmar que o card "Usar um convite" permanece não-clicável (`disabled` no botão)
