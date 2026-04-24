import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useAccountStore } from '@/stores/accountStore'
import AuthLayout from '@/layouts/AuthLayout.vue'
import OnboardingLayout from '@/layouts/OnboardingLayout.vue'

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

    // Callback do OAuth2 — sem layout próprio
    {
      path: '/oauth2/callback',
      name: 'oauth2-callback',
      component: () => import('@/views/auth/OAuthCallbackView.vue')
    },

    // Onboarding — exige autenticação, mas sem conta vinculada
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

    // Área autenticada — exige autenticação e ao menos uma conta
    {
      path: '/app',
      meta: { requiresAuth: true, requiresAccount: true },
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          // Placeholder até a tela de dashboard ser implementada
          component: () => import('@/views/onboarding/OnboardingView.vue')
        }
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

  // Rota protegida sem autenticação → login
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' }
  }

  // Rota de guest com usuário já autenticado → dashboard
  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }

  // Para rotas que dependem do estado de contas, garante que os dados estão carregados
  const needsAccountCheck = to.meta.requiresAccount || to.meta.guestAccount
  if (auth.isAuthenticated && needsAccountCheck && !accountStore.loaded) {
    try {
      await accountStore.fetchUserAccounts()
    } catch {
      // Se falhar ao buscar contas, desloga por segurança
      auth.clearAuth()
      return { name: 'login' }
    }
  }

  // Rota da área autenticada sem nenhuma conta → onboarding
  if (to.meta.requiresAccount && !accountStore.hasAccounts) {
    return { name: 'onboarding' }
  }

  // Rota de onboarding com conta já existente → dashboard
  if (to.meta.guestAccount && accountStore.loaded && accountStore.hasAccounts) {
    return { name: 'dashboard' }
  }
})

export default router