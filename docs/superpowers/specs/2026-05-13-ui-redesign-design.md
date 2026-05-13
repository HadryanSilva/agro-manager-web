# UI Redesign — Emerald SaaS

**Data:** 2026-05-13  
**Status:** Aprovado  
**Escopo:** Redesign visual do sistema de tokens CSS e tipografia. Sem mudanças em lógica, rotas ou estrutura de componentes.

---

## Objetivo

Modernizar a identidade visual do Agro Manager Web para um estilo SaaS limpo e elevado, que funcione bem em temas claro e escuro, com tipografia sans-serif amigável em todo o sistema.

---

## 1. Tipografia

### Fonte

Substituir ambas as fontes atuais por uma única família:

- **Antes:** `DM Sans` (body) + `DM Serif Display` (display/headings)
- **Depois:** `Plus Jakarta Sans` em todos os contextos

**Import (Google Fonts):**
```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
```

### Tokens

```css
--font-body:    'Plus Jakarta Sans', sans-serif;
/* --font-display removido */
```

A variável `--font-display` é **removida**. Todos os lugares que a usam passam a usar `--font-body` (ou `inherit`).

### Ajustes por componente

| Seletor | Mudança |
|---|---|
| `.dashboard__title`, `.section__title` | Remove `font-family: var(--font-display)` → herda `--font-body`; adiciona `font-weight: 700` |
| `.metric-card__value`, `.metric-card__value--sm` | Remove `font-family: var(--font-display)` → herda; `font-weight: 400` → `700` |
| `.sidebar__brand-name` | Remove `font-family: var(--font-display)`, remove `font-style: italic` → `font-weight: 800` |
| `.sidebar__user-initials` | Remove `font-family: var(--font-display)` → herda |
| `.finance-total__value`, `.status-card__count` | Remove `font-family: var(--font-display)` → herda; mantém tamanho |

A escala de tamanhos (`--text-xs` … `--text-5xl`) permanece inalterada.

---

## 2. Paleta de Cores

### Light Mode

| Token | Antes | Depois |
|---|---|---|
| `--color-background` | `#faf9f7` | `#f9fafb` |
| `--color-surface` | `#f5f2ed` | `#f3f4f6` |
| `--color-card` | `#ffffff` | `#ffffff` |
| `--color-border` | `#e4e0d8` | `#e5e7eb` |
| `--color-border-focus` | `#1b3a2d` | `#059669` |
| `--color-text` | `#1b3a2d` | `#111827` |
| `--color-text-muted` | `#7b9e87` | `#6b7280` |
| `--color-text-placeholder` | `#a3c4b5` | `#9ca3af` |
| `--color-primary` | `#1b3a2d` | `#059669` |
| `--color-primary-dark` | `#142d22` | `#047857` |
| `--color-primary-light` | `#e8f4ed` | `#d1fae5` |
| `--color-accent` | `#c9a96e` | `#d97706` |
| `--color-accent-light` | `#f7f0e4` | `#fef3c7` |
| `--color-success` | `#276749` | `#059669` |
| `--color-success-light` | `#e8f4ed` | `#d1fae5` |
| `--color-warning` | `#b7791f` | `#d97706` |
| `--color-warning-light` | `#fef9ec` | `#fef3c7` |
| `--color-error` | `#c0392b` | `#dc2626` |
| `--color-error-light` | `#fdf2f0` | `#fee2e2` |
| `--color-info` | `#2b6cb0` | `#2563eb` |
| `--color-info-light` | `#ebf5ff` | `#dbeafe` |

### Dark Mode (`[data-theme="dark"]`)

| Token | Antes | Depois |
|---|---|---|
| `--color-background` | `#100f0d` | `#0f172a` |
| `--color-surface` | `#18170f` | `#1e293b` |
| `--color-card` | `#201f17` | `#1e293b` |
| `--color-border` | `#332f24` | `#334155` |
| `--color-border-focus` | `#7ec49a` | `#34d399` |
| `--color-text` | `#eae8e0` | `#f1f5f9` |
| `--color-text-muted` | `#8a8272` | `#94a3b8` |
| `--color-text-placeholder` | `#524c3c` | `#475569` |
| `--color-primary` | `#7ec49a` | `#34d399` |
| `--color-primary-dark` | `#68af84` | `#10b981` |
| `--color-primary-light` | `#101a12` | `#022c22` |
| `--color-accent` | `#d4aa5a` | `#fbbf24` |
| `--color-accent-light` | `#221806` | `#1c1408` |
| `--color-success` | `#5cb87a` | `#34d399` |
| `--color-success-light` | `#0a1810` | `#022c22` |
| `--color-warning` | `#e9a84c` | `#fbbf24` |
| `--color-warning-light` | `#201506` | `#1c1408` |
| `--color-error` | `#e57373` | `#f87171` |
| `--color-error-light` | `#1e0a0a` | `#1f0a0a` |
| `--color-info` | `#64b5f6` | `#60a5fa` |
| `--color-info-light` | `#081525` | `#0a1628` |

---

## 3. Sombras

```css
/* Light mode */
--shadow-card:       0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.06);
--shadow-card-hover: 0 4px 8px rgba(0,0,0,0.08), 0 8px 20px rgba(0,0,0,0.07);
--shadow-elevated:   0 8px 24px rgba(0,0,0,0.10);

/* Dark mode — sem mudança de estrutura, já usa rgba(0,0,0,...) */
```

---

## 4. Border Radius

| Token | Antes | Depois |
|---|---|---|
| `--radius-sm` | `8px` | `8px` (sem mudança) |
| `--radius-md` | `12px` | `12px` (sem mudança) |
| `--radius-lg` | `18px` | `16px` |
| `--radius-xl` | `24px` | `20px` |

---

## 5. Finance Card

Atualmente o `.finance-card` usa background fixo `#1b3a2d` (verde-escuro) no light mode, com variáveis privadas `--_fc-*` sobrepostas no dark mode. No novo design:

- Light mode: usa `--color-surface` como background + `border-left: 3px solid var(--color-primary)`
- Dark mode: usa `--color-card` + mesma borda
- As variáveis privadas `--_fc-*` são removidas
- Os seletores de cor internos passam a referenciar os tokens globais diretamente

---

## 6. Arquivos Afetados

| Arquivo | Tipo de mudança |
|---|---|
| `src/assets/base.css` | Substituição do import de fonte, remoção de `--font-display`, atualização de todos os tokens de cor, sombras e radii |
| `src/layouts/AppLayout.vue` | Remove `font-family: var(--font-display)` e `font-style: italic` do `.sidebar__brand-name` e `.sidebar__user-initials` |
| `src/layouts/TraderLayout.vue` | Idem para brand name se aplicável |
| `src/views/DashboardView.vue` | Remove `var(--font-display)` de `.dashboard__title`, `.section__title`, `.metric-card__value`, `.finance-total__value`, `.status-card__count`; adiciona `font-weight: 700` onde necessário; refatora `.finance-card` para usar tokens globais |
| Demais views/components | Buscar e remover qualquer uso de `var(--font-display)` |

---

## 7. Fora do Escopo

- Estrutura HTML dos componentes
- Lógica de negócio, stores, services
- Rotas
- Adição de biblioteca de componentes (Tailwind, shadcn, etc.)
- Mudança no sistema de temas (continua `[data-theme="dark"]`)
