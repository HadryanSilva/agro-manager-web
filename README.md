<div align="center">

# 🌱 Agro Manager — Frontend

**Interface web para gestão agrícola de produtores de melancia**

[![Vue](https://img.shields.io/badge/Vue-3-4FC08D?style=flat-square&logo=vue.js&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Pinia](https://img.shields.io/badge/Pinia-3-FFD859?style=flat-square&logo=pinia&logoColor=black)](https://pinia.vuejs.org/)

</div>

---

## Sobre o projeto

O **Agro Manager** é uma plataforma de gestão agrícola desenvolvida para produtores de melancia. Este repositório contém a interface web — responsiva para desktop e mobile — que consome a API REST do backend.

## Funcionalidades

| Tela | Descrição |
|---|---|
| **Dashboard** | KPIs da conta, resumo financeiro, previsão do tempo 14 dias |
| **Lavouras** | Cadastro e acompanhamento com status dinâmico |
| **Despesas** | Controle por lavoura com histórico de atividades |
| **Transações** | Visão consolidada com paginação e filtros |
| **Cotações** | Comparação de preços de insumos e cálculo de economia |
| **Relatórios** | Financeiro por lavoura com exportação para Excel |
| **Configurações** | Perfil, senha, membros da conta e convites por link |

## Stack

- **Vue 3** (Composition API + `<script setup>`)
- **TypeScript 5**
- **Vite 8** — build e dev server
- **Pinia** — gerenciamento de estado
- **Vue Router 4** — roteamento com guards de autenticação
- **Axios** — requisições HTTP com interceptor de refresh token
- **Docker** multi-stage (Node 24 + nginx:alpine)

## APIs externas utilizadas

| API | Uso | Custo |
|---|---|---|
| [Open-Meteo](https://open-meteo.com) | Previsão do tempo 15 dias | Gratuito |
| [Nominatim/OSM](https://nominatim.org) | Geocoding e reverse geocoding | Gratuito |
| [SheetJS](https://sheetjs.com) | Exportação de relatórios para Excel | Gratuito |

## Pré-requisitos

- Node.js 20+
- npm 10+

## Configuração e execução

### 1. Clonar o repositório

```bash
git clone https://github.com/HadryanSilva/agro-manager-web.git
cd agro-manager-web
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

| Variável | Descrição | Padrão |
|---|---|---|
| `VITE_API_URL` | URL base da API backend | `http://localhost:8080` |

### 4. Executar em desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`.

### 5. Build de produção

```bash
npm run build
```

## Estrutura do projeto

```
src/
├── components/        # Componentes reutilizáveis
│   ├── AccountSwitcher.vue
│   ├── ConfirmModal.vue
│   ├── FarmActivityTimeline.vue
│   ├── SettingsTabs.vue
│   ├── WeatherCard.vue
│   └── WeatherModal.vue
├── composables/       # Lógica reutilizável (useTheme, useWeather)
├── layouts/           # AuthLayout, AppLayout, OnboardingLayout
├── router/            # Rotas e guards de navegação
├── services/          # Integração com a API (Axios)
├── stores/            # Estado global (Pinia)
│   ├── authStore.ts   # Autenticação e tokens
│   ├── accountStore.ts# Seleção de conta ativa
│   └── userStore.ts   # Perfil do usuário logado
└── views/             # Páginas da aplicação
    ├── auth/
    ├── expenses/
    ├── farms/
    ├── invite/
    ├── onboarding/
    ├── quotations/
    ├── reports/
    ├── settings/
    └── transactions/
```

## Execução com Docker

```bash
docker build -t agro-manager-frontend .
docker run -p 80:80 agro-manager-frontend
```

## Repositório relacionado

Backend: [agro-manager](https://github.com/HadryanSilva/agro-manager)