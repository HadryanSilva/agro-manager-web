import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import AuthLayout from '@/layouts/AuthLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Redireciona a raiz com base no estado de autenticação
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

    // Callback do OAuth2 — fora do AuthLayout pois não usa o card
    {
      path: '/oauth2/callback',
      name: 'oauth2-callback',
      component: () => import('@/views/auth/OAuthCallbackView.vue')
    },

    // Área autenticada (rotas futuras entrarão aqui)
    {
      path: '/app',
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          // Placeholder até a tela de dashboard ser implementada
          component: () => import('@/views/auth/LoginView.vue')
        }
      ]
    },

    // Fallback — redireciona rotas não encontradas para a raiz
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

// Guard global de navegação
router.beforeEach((to) => {
  const auth = useAuthStore()

  // Rota protegida sem autenticação → vai para login
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' }
  }

  // Rota de guest com autenticação ativa → vai para dashboard
  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }
})

export default router