# Field Premium — Design System Refresh

**Date:** 2026-05-11  
**Scope:** Full system refresh — tokens, layouts, dashboard, components  
**Approach:** C (Full System Refresh)

---

## Aesthetic Direction

**Field Premium**: verde floresta profundo + creme quente. Refinado, botânico, discretamente premium. Inspirado em marcas agrícolas de alta qualidade. Coerente com o contexto de gestão de lavouras de melancia no Brasil.

---

## Typography

| Role | Font | Weight | Notes |
|------|------|--------|-------|
| Display / títulos de página | DM Serif Display | Regular + Italic | Itálico em dourado para palavras-chave |
| Títulos de seção | DM Serif Display | Regular | `font-size: 1rem–1.75rem` |
| Corpo / UI | DM Sans | 400, 500, 600, 700 | Todos os labels, inputs, botões, tabelas |
| Labels uppercase | DM Sans | 700 | `letter-spacing: 0.07em`, `text-transform: uppercase` |
| Valores numéricos grandes | DM Serif Display | Regular | Métricas do dashboard |

Google Fonts import: `DM+Serif+Display:ital@0;1` + `DM+Sans:ital,opsz,wght@0,9..40,400;...700`

---

## Color Tokens

### Light Mode (`:root`)

```css
--color-background:   #faf9f7;   /* creme quente */
--color-surface:      #f5f2ed;   /* fundo levemente mais escuro para seções */
--color-card:         #ffffff;
--color-border:       #e4e0d8;
--color-border-focus: #1b3a2d;

--color-text:             #1b3a2d;   /* verde floresta profundo */
--color-text-muted:       #7b9e87;   /* sage green */
--color-text-placeholder: #a3c4b5;

--color-primary:       #1b3a2d;
--color-primary-dark:  #142d22;
--color-primary-light: #e8f4ed;

--color-accent:        #c9a96e;   /* dourado/trigo */
--color-accent-light:  #f7f0e4;

--color-success:       #276749;
--color-success-light: #e8f4ed;

--color-warning:       #b7791f;
--color-warning-light: #fef9ec;

--color-error:         #c0392b;
--color-error-light:   #fdf2f0;

--color-info:          #2b6cb0;
--color-info-light:    #ebf5ff;

--shadow-card:         0 1px 4px rgba(27,58,45,0.06), 0 4px 16px rgba(27,58,45,0.05);
--shadow-card-hover:   0 2px 8px rgba(27,58,45,0.09), 0 8px 24px rgba(27,58,45,0.08);
--shadow-elevated:     0 4px 24px rgba(27,58,45,0.12);

--radius-sm:  8px;
--radius-md:  12px;
--radius-lg:  18px;
--radius-xl:  24px;
```

### Dark Mode (`[data-theme="dark"]`)

```css
--color-background:   #0e1612;
--color-surface:      #131d17;
--color-card:         #182318;
--color-border:       #2d4a38;
--color-border-focus: #7b9e87;

--color-text:             #e8f0ea;
--color-text-muted:       #7b9e87;
--color-text-placeholder: #4d7a5e;

/* No dark mode, primary vira sage green — botões e acentos ficam
   legíveis sobre o fundo escuro sem perder o caráter verde do sistema */
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

--shadow-card:         0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.35);
--shadow-card-hover:   0 2px 8px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.4);
--shadow-elevated:     0 4px 24px rgba(0,0,0,0.5);
```

---

## Files to Modify

### 1. `src/assets/base.css`
- Substituir toda a paleta pelos novos tokens
- Adicionar `--color-surface`, `--color-accent`, `--color-accent-light`, `--color-success`, `--color-success-light`, `--color-warning`, `--color-warning-light`, `--color-info`, `--color-info-light`, `--shadow-elevated`, `--radius-xl`
- Atualizar `--radius-sm` para `8px`, `--radius-md` para `12px`, `--radius-lg` para `18px`
- Adicionar import do Google Fonts (DM Serif Display + DM Sans)
- Trocar `font-family` do body para `'DM Sans', sans-serif`

### 2. `src/layouts/AppLayout.vue`
- Brand: trocar emoji 🌱 por ícone SVG em container `#1b3a2d` + nome em DM Serif Display itálico
- Nav items: adicionar `border-left: 2px solid transparent` + `border-left-color: var(--color-primary)` no estado ativo
- Sidebar background: `var(--color-card)`
- Account chip: background `var(--color-primary-light)`, texto `var(--color-primary)`
- User avatar: background `var(--color-primary)`, iniciais em DM Serif Display
- Nav item hover: `var(--color-surface)` ao invés de `var(--color-background)`
- Remover `.theme-corner` fixo no desktop (mover ThemeToggle para dentro da sidebar footer); no mobile permanece no topbar como está

### 3. `src/layouts/AuthLayout.vue`
- Painel esquerdo: manter `#1b3a2d` como fundo **hardcoded** — é uma superfície de marca, não afetada pelo dark mode (sempre escura)
- Brand name: DM Serif Display itálico
- Título hero: DM Serif Display com `<em>` em `var(--color-accent)` itálico
- Auth card: `border-radius: var(--radius-lg)`, `border: 1px solid var(--color-border)`, `box-shadow: var(--shadow-elevated)`
- Adicionar SVG decorativo botânico sutil no painel esquerdo (opacidade 6%)

### 4. `src/views/DashboardView.vue`
- Título de página: DM Serif Display `font-size: 1.75rem`
- Títulos de seção: DM Serif Display `font-size: 1.05rem`
- Valores das métricas: DM Serif Display para números grandes
- Finance card: fundo `var(--color-primary)` (verde floresta), texto branco — card invertido com destaque visual
- Metric cards: remover ícone colorido inline, substituir por `var(--color-*-light)` + `var(--color-*)`
- Badges: `border-radius: 20px`, cores alinhadas aos novos tokens
- Tabela: `th` com `background: var(--color-surface)`, sem `border-radius` no wrapper quebrando

### 5. `src/assets/main.css`
- Adicionar regras globais para `a`, `strong`, `h1-h6` herdando a nova fonte
- Transição suave no tema: já existe, manter

### 6. Componentes secundários (escopo menor)
- `src/components/ThemeToggle.vue`: ajustar cores para o novo tema
- `src/views/auth/LoginView.vue` e `RegisterView.vue`: botão primário com `var(--color-primary)` (#1b3a2d), inputs com novos radii e focus style
- `src/views/farms/FarmsView.vue` e demais views de listagem: badges e table styles herdados dos tokens (sem alteração de estrutura)

---

## Component Patterns

### Botão primário
```
background: var(--color-primary)
color: var(--color-primary-light) / #e8f4ed
border-radius: var(--radius-sm)  /* 8px */
font-family: DM Sans, font-weight: 600
```

### Input
```
border: 1.5px solid var(--color-border)
border-radius: var(--radius-sm)
background: var(--color-surface)
focus → border-color: var(--color-border-focus), box-shadow: 0 0 0 3px rgba(27,58,45,0.1)
```

### Card
```
background: var(--color-card)
border: 1px solid var(--color-border)
border-radius: var(--radius-md)  /* 12px */
box-shadow: var(--shadow-card)
```

### Badge de status
```
border-radius: 20px
font-size: 0.68rem, font-weight: 600, letter-spacing: 0.03em
Em andamento: background var(--color-success-light), color var(--color-success)
Em preparação: background var(--color-warning-light), color var(--color-warning)
Colhida: background var(--color-info-light), color var(--color-info)
Cancelada: background var(--color-error-light), color var(--color-error)
```

---

## Animations

- **Route transitions**: nenhuma adicionada (fora de escopo, requer `<Transition>` no RouterView — pode ser adicionado em iteração futura)
- **Skeleton pulse**: manter existente
- **Barra de progresso**: manter transição `width 0.6s ease`
- **Hover em cards/rows**: manter transições 0.12–0.15s existentes

---

## Out of Scope

- Redesign de `ExpensesView`, `SalesView`, `QuotationsView`, `ReportsView`, `SettingsView` — herdam os tokens automaticamente
- Formulários de criação/edição (FarmFormView, ExpenseFormView, etc.) — herdam inputs/buttons dos tokens
- Alterações de lógica de negócio, routing ou stores
- Mobile app / PWA

---

## Success Criteria

1. `base.css` contém todos os novos tokens incluindo os anteriormente ausentes (`--color-warning`, `--color-info`, `--color-success` e variantes)
2. Fonte DM Serif Display visível nos títulos de página e métricas do dashboard
3. Sidebar com brand em serif itálico e indicador de ativo por borda esquerda
4. Auth layout com título hero em serif + itálico dourado
5. Finance card do dashboard com fundo `var(--color-primary)` (verde floresta)
6. Dark mode funcional com a nova paleta (sem referências hardcoded a cores fora dos tokens)
7. Nenhum `--color-warning`, `--color-info`, `--color-success` indefinido em nenhuma view
