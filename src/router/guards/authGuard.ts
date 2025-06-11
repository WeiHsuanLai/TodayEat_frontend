import type { RouteLocationNormalized, NavigationGuardNext } from 'vue-router';
import { useUserStore } from 'src/stores/userStore';
import { Notify } from 'quasar';

export function authGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) {
  const userStore = useUserStore();

  if (!userStore.isLoggedIn) {
    userStore.restore(); // 還原 localStorage 狀態
  }

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    Notify.create({
      type: 'warning',
      message: '請先登入後再操作',
      position: 'center',
      timeout: 1500,
    });

    return next('/'); // 或 next('/login')
  }

  next();
}
