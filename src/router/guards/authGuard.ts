import type { RouteLocationNormalized, NavigationGuardNext } from 'vue-router';
import { useUserStore } from 'src/stores/userStore';
import { Notify } from 'quasar';
import UserRole from 'src/enums/UserRole';

export function authGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) {
  const userStore = useUserStore();
  console.log('目前使用者角色:', userStore.role);

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

  // 需要管理員但非管理員
  if (to.meta.requiresAdmin && userStore.role !== UserRole.ADMIN) {
    Notify.create({
      type: 'negative',
      message: '只有管理員可以存取此頁面',
    });
    return next('/');
  }

  next();
}
