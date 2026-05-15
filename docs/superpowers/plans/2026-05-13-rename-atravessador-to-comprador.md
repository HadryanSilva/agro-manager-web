# Rename "Atravessador" → "Comprador" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o termo "Atravessador" por "Comprador" em todos os textos visíveis ao usuário e comentários do código, tornando a interface mais familiar ao contexto da produção de melancia.

**Architecture:** Mudança puramente textual — apenas strings exibidas na UI e comentários internos. Nenhum identificador de código (nomes de arquivos, funções, classes CSS, stores) será alterado, pois são detalhes de implementação internos sem impacto no usuário.

**Tech Stack:** Vue 3, TypeScript — edições diretas em `.vue` e `.ts`.

---

## Análise de Viabilidade

**Escopo reduzido — 3 arquivos, ~12 linhas:**

| Arquivo | Tipo de alteração |
|---|---|
| `src/layouts/TraderLayout.vue` | Texto UI + comentários |
| `src/layouts/AppLayout.vue` | Texto UI + comentários |
| `src/router/index.ts` | Comentário |
| `src/stores/traderStore.ts` | Comentário JSDoc |

**O que NÃO muda** (identificadores internos — sem valor em alterar):
- Nomes de arquivo: `TraderLayout.vue`, `traderStore.ts`
- Funções: `exitTraderMode`, `enterTraderMode`
- Classes CSS: `.trader-mode-btn`, `.topbar__mode-badge`
- Rotas: `/trader/*`
- Nomes de store: `useTraderStore`

---

## File Structure

- Modify: `src/layouts/TraderLayout.vue` — textos visíveis e comentários
- Modify: `src/layouts/AppLayout.vue` — textos visíveis e comentários
- Modify: `src/router/index.ts` — comentário de seção
- Modify: `src/stores/traderStore.ts` — comentário JSDoc

---

### Task 1: Atualizar textos visíveis e comentários em `TraderLayout.vue`

**Files:**
- Modify: `src/layouts/TraderLayout.vue:50,87,92,167,168,237`

- [ ] **Step 1: Abrir o arquivo e localizar as ocorrências**

  Verificar as linhas antes de editar:
  ```
  L50:  // Sai do modo atravessador e volta ao ambiente do produtor
  L87:  <!-- Badge do modo atravessador -->
  L92:  <span>Modo Atravessador</span>
  L167: title="Sair do Modo Atravessador"
  L168: <span class="topbar__mode-badge">Atravessador</span>
  L237: /* ── Badge modo atravessador ─────... */
  ```

- [ ] **Step 2: Substituir comentário de função (L50)**

  De:
  ```ts
  // Sai do modo atravessador e volta ao ambiente do produtor
  ```
  Para:
  ```ts
  // Sai do modo comprador e volta ao ambiente do produtor
  ```

- [ ] **Step 3: Substituir comentário HTML do badge (L87)**

  De:
  ```html
  <!-- Badge do modo atravessador -->
  ```
  Para:
  ```html
  <!-- Badge do modo comprador -->
  ```

- [ ] **Step 4: Substituir texto visível do badge (L92)**

  De:
  ```html
  <span>Modo Atravessador</span>
  ```
  Para:
  ```html
  <span>Modo Comprador</span>
  ```

- [ ] **Step 5: Substituir atributo `title` do botão de saída (L167)**

  De:
  ```html
  <button class="topbar__exit-btn" @click="exitTraderMode" title="Sair do Modo Atravessador">
  ```
  Para:
  ```html
  <button class="topbar__exit-btn" @click="exitTraderMode" title="Sair do Modo Comprador">
  ```

- [ ] **Step 6: Substituir texto visível dentro do botão (L168)**

  De:
  ```html
  <span class="topbar__mode-badge">Atravessador</span>
  ```
  Para:
  ```html
  <span class="topbar__mode-badge">Comprador</span>
  ```

- [ ] **Step 7: Substituir comentário de seção CSS (L237)**

  De:
  ```css
  /* ── Badge modo atravessador ─────────────────────────────────────────────── */
  ```
  Para:
  ```css
  /* ── Badge modo comprador ───────────────────────────────────────────────── */
  ```

- [ ] **Step 8: Verificar que não há outras ocorrências no arquivo**

  ```powershell
  Select-String -Path "src\layouts\TraderLayout.vue" -Pattern "atravessador" -CaseSensitive:$false
  ```
  Expected: nenhuma saída (zero matches).

- [ ] **Step 9: Commit**

  ```powershell
  git add src/layouts/TraderLayout.vue
  git commit -m "feat: rename 'Atravessador' to 'Comprador' in TraderLayout UI text"
  ```

---

### Task 2: Atualizar textos visíveis e comentários em `AppLayout.vue`

**Files:**
- Modify: `src/layouts/AppLayout.vue:19,125,135,491`

- [ ] **Step 1: Localizar as ocorrências**

  ```
  L19:  // Ativa o modo atravessador e navega para o dashboard do traversador
  L125: <!-- Botão de entrada no modo atravessador -->
  L135: <span class="trader-mode-btn__text">Modo Atravessador</span>
  L491: /* ── Botão modo atravessador ─────... */
  ```

- [ ] **Step 2: Substituir comentário de função (L19)**

  De:
  ```ts
  // Ativa o modo atravessador e navega para o dashboard do traversador
  ```
  Para:
  ```ts
  // Ativa o modo comprador e navega para o dashboard do comprador
  ```

- [ ] **Step 3: Substituir comentário HTML do botão (L125)**

  De:
  ```html
  <!-- Botão de entrada no modo atravessador -->
  ```
  Para:
  ```html
  <!-- Botão de entrada no modo comprador -->
  ```

- [ ] **Step 4: Substituir texto visível do botão (L135)**

  De:
  ```html
  <span class="trader-mode-btn__text">Modo Atravessador</span>
  ```
  Para:
  ```html
  <span class="trader-mode-btn__text">Modo Comprador</span>
  ```

- [ ] **Step 5: Substituir comentário de seção CSS (L491)**

  De:
  ```css
  /* ── Botão modo atravessador ─────────────────────────────────────────────── */
  ```
  Para:
  ```css
  /* ── Botão modo comprador ───────────────────────────────────────────────── */
  ```

- [ ] **Step 6: Verificar que não há outras ocorrências no arquivo**

  ```powershell
  Select-String -Path "src\layouts\AppLayout.vue" -Pattern "atravessador" -CaseSensitive:$false
  ```
  Expected: nenhuma saída.

- [ ] **Step 7: Commit**

  ```powershell
  git add src/layouts/AppLayout.vue
  git commit -m "feat: rename 'Atravessador' to 'Comprador' in AppLayout UI text"
  ```

---

### Task 3: Atualizar comentários em `router/index.ts` e `traderStore.ts`

**Files:**
- Modify: `src/router/index.ts:210`
- Modify: `src/stores/traderStore.ts:7`

- [ ] **Step 1: Substituir comentário de seção no router (index.ts L210)**

  De:
  ```ts
  // ── Modo Atravessador ──────────────────────────────────────────────────
  ```
  Para:
  ```ts
  // ── Modo Comprador ─────────────────────────────────────────────────────
  ```

- [ ] **Step 2: Substituir comentário JSDoc no store (traderStore.ts L7)**

  De:
  ```ts
   * Store do modo atravessador.
  ```
  Para:
  ```ts
   * Store do modo comprador.
  ```

- [ ] **Step 3: Verificar ausência de ocorrências remanescentes em todo o projeto**

  ```powershell
  Select-String -Path "src\**\*" -Pattern "atravessador" -CaseSensitive:$false -Recurse
  ```
  Expected: nenhuma saída.

- [ ] **Step 4: Commit final**

  ```powershell
  git add src/router/index.ts src/stores/traderStore.ts
  git commit -m "chore: update comments — atravessador → comprador in router and store"
  ```

---

## Verificação Final

- [ ] Rodar o servidor de dev e verificar visualmente:
  - Botão na `AppLayout` exibe **"Modo Comprador"**
  - Badge e botão de saída na `TraderLayout` exibem **"Comprador"** e **"Modo Comprador"**
  - Tooltip do botão de saída exibe **"Sair do Modo Comprador"**
- [ ] Confirmar que nenhuma funcionalidade foi alterada (apenas texto)
