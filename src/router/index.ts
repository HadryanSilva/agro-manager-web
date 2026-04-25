import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useAccountStore } from '@/stores/accountStore'
import AuthLayout from '@/layouts/AuthLayout.vue'
import OnboardingLayout from '@/layouts/OnboardingLayout.vue'
import AppLayout from '@/layouts/AppLayout.vue'

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
        {
          path: '',
          redirect: { name: 'dashboard' }
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue')
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
        }
      ]
    },

    // Configurações — também usa AppLayout para manter a sidebar
    {
      path: '/settings',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: { name: 'settings-profile' }
        },
      ]
    },

    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

// Guard global de navegação
router.beforeEach(async (to) => {
  const auth = useAuthStore()
  const accountStore = useAccountStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' }
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