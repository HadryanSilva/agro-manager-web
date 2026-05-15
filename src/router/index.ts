import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useAccountStore } from '@/stores/accountStore'
import AuthLayout from '@/layouts/AuthLayout.vue'
import OnboardingLayout from '@/layouts/OnboardingLayout.vue'
import AppLayout from '@/layouts/AppLayout.vue'
import TraderLayout from '@/layouts/TraderLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: () => {
        const auth = useAuthStore()
        return auth.isAuthenticated ? { name: 'dashboard' } : { name: 'login' }
      }
    },

    // Rotas públicas de autenticação
    {
      path: '/auth',
      component: AuthLayout,
      children: [
        {
          path: 'login',
          name: 'login',
          component: () => import('@/views/auth/LoginView.vue'),
          meta: { guestOnly: true }
        },
        {
          path: 'register',
          name: 'register',
          component: () => import('@/views/auth/RegisterView.vue'),
          meta: { guestOnly: true }
        }
      ]
    },

    // Callback do OAuth2
    {
      path: '/oauth2/callback',
      name: 'oauth2-callback',
      component: () => import('@/views/auth/OAuthCallbackView.vue')
    },

    // Página de aceite de convite
    {
      path: '/invite/:token',
      name: 'invite-accept',
      component: () => import('@/views/invite/InviteAcceptView.vue'),
      meta: { requiresAuth: true }
    },

    // Onboarding — autenticado, sem conta
    {
      path: '/onboarding',
      component: OnboardingLayout,
      meta: { requiresAuth: true, guestAccount: true },
      children: [
        {
          path: '',
          name: 'onboarding',
          component: () => import('@/views/onboarding/OnboardingView.vue')
        },
        {
          path: 'create',
          name: 'create-account',
          component: () => import('@/views/onboarding/CreateAccountView.vue')
        }
      ]
    },

    // Área autenticada com sidebar
    {
      path: '/app',
      component: AppLayout,
      meta: { requiresAuth: true, requiresAccount: true },
      children: [
        { path: '', redirect: { name: 'dashboard' } },

        // Dashboard
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue')
        },

        // ── Transações ─────────────────────────────────────────────
        {
          path: 'transactions',
          name: 'transactions',
          component: () => import('@/views/transactions/TransactionsView.vue')
        },
        // Despesas gerais da conta (sem lavoura)
        {
          path: 'transactions/expenses/new',
          name: 'general-expense-create',
          component: () => import('@/views/transactions/GeneralExpenseFormView.vue')
        },
        {
          path: 'transactions/expenses/:expenseId/edit',
          name: 'general-expense-edit',
          component: () => import('@/views/transactions/GeneralExpenseFormView.vue')
        },

        // ── Cotações ───────────────────────────────────────────────
        {
          path: 'quotations',
          name: 'quotations',
          component: () => import('@/views/quotations/QuotationsView.vue')
        },
        {
          path: 'quotations/new',
          name: 'quotation-create',
          component: () => import('@/views/quotations/QuotationFormView.vue')
        },
        {
          path: 'quotations/:quotationId/edit',
          name: 'quotation-edit',
          component: () => import('@/views/quotations/QuotationFormView.vue')
        },

        // ── Lavouras ──────────────────────────────────────────────
        {
          path: 'farms',
          name: 'farms',
          component: () => import('@/views/farms/FarmsView.vue')
        },
        {
          path: 'farms/new',
          name: 'farm-create',
          component: () => import('@/views/farms/FarmFormView.vue')
        },
        {
          path: 'farms/:farmId/edit',
          name: 'farm-edit',
          component: () => import('@/views/farms/FarmFormView.vue')
        },

        // ── Despesas por lavoura ───────────────────────────────────
        {
          path: 'farms/:farmId/expenses',
          name: 'farm-expenses',
          component: () => import('@/views/expenses/ExpensesView.vue')
        },
        {
          path: 'farms/:farmId/expenses/new',
          name: 'expense-create',
          component: () => import('@/views/expenses/ExpenseFormView.vue')
        },
        {
          path: 'farms/:farmId/expenses/:expenseId/edit',
          name: 'expense-edit',
          component: () => import('@/views/expenses/ExpenseFormView.vue')
        },

        // ── Vendas ────────────────────────────────────────────────
        {
          path: 'sales',
          name: 'sales',
          component: () => import('@/views/sales/SalesView.vue')
        }
      ]
    },

    // ── Relatórios ─────────────────────────────────────────────────
    {
      path: '/reports',
      component: AppLayout,
      meta: { requiresAuth: true, requiresAccount: true },
      children: [
        {
          path: '',
          name: 'reports',
          component: () => import('@/views/reports/ReportsView.vue')
        },
        {
          path: 'farms/:farmId/financial',
          name: 'farm-report',
          component: () => import('@/views/farms/FarmReportView.vue')
        }
      ]
    },

    // ── Configurações ──────────────────────────────────────────────
    {
      path: '/settings',
      component: AppLayout,
      meta: { requiresAuth: true, requiresAccount: true },
      children: [
        { path: '', redirect: { name: 'settings-profile' } },
        {
          path: 'profile',
          name: 'settings-profile',
          component: () => import('@/views/settings/ProfileSettingsView.vue')
        },
        {
          path: 'members',
          name: 'settings-members',
          component: () => import('@/views/settings/MembersSettingsView.vue')
        },
        {
          path: 'account',
          name: 'settings-account',
          component: () => import('@/views/settings/AccountSettingsView.vue')
        },
      ]
    },
    // ── Modo Comprador ─────────────────────────────────────────────────────
    {
      path: '/trader',
      component: TraderLayout,
      meta: { requiresAuth: true, requiresAccount: true },
      children: [
        { path: '', redirect: { name: 'trader-dashboard' } },
        {
          path: 'dashboard',
          name: 'trader-dashboard',
          component: () => import('@/views/trader/TraderDashboardView.vue')
        },
        {
          path: 'suppliers',
          name: 'trader-suppliers',
          component: () => import('@/views/trader/TradingSuppliersView.vue')
        },
        {
          path: 'clients',
          name: 'trader-clients',
          component: () => import('@/views/trader/TradingClientsView.vue')
        },
        {
          path: 'orders',
          name: 'trader-orders',
          component: () => import('@/views/trader/ClientOrdersView.vue')
        },
        {
          path: 'orders/new',
          name: 'trader-orders-new',
          component: () => import('@/views/trader/ClientOrderFormView.vue')
        },
        {
          path: 'orders/:orderId',
          name: 'trader-order-detail',
          component: () => import('@/views/trader/ClientOrderDetailView.vue')
        },
        {
          path: 'orders/:orderId/edit',
          name: 'trader-order-edit',
          component: () => import('@/views/trader/ClientOrderFormView.vue')
        },
      ]
    },

    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
})

// Guard global de navegação
router.beforeEach(async (to) => {
  const auth = useAuthStore()
  const accountStore = useAccountStore()

  if ((to.meta.guestOnly || to.path === '/') && !auth.isAuthenticated && auth.hasStoredSession) {
    await auth.restoreSession()
  }

  // Tenta restaurar a sessão via refresh token antes de redirecionar para login
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    await auth.restoreSession()

    if (!auth.isAuthenticated) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }

  const needsAccountCheck = to.meta.requiresAccount || to.meta.guestAccount
  if (auth.isAuthenticated && needsAccountCheck && !accountStore.loaded) {
    try {
      await accountStore.fetchUserAccounts()
    } catch {
      auth.clearAuth()
      return { name: 'login' }
    }
  }

  if (to.meta.requiresAccount && !accountStore.hasAccounts) {
    return { name: 'onboarding' }
  }

  if (to.meta.guestAccount && accountStore.loaded && accountStore.hasAccounts) {
    return { name: 'dashboard' }
  }
})

export default router
