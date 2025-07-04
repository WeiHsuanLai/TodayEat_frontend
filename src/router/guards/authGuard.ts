import type { RouteLocationNormalized, NavigationGuardNext } from 'vue-router';
import { useUserStore } from 'src/stores/userStore';
import { Notify } from 'quasar';
import UserRole from 'src/enums/UserRole';
import { api } from 'src/composables/axios';

export async function authGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) {
  const userStore = useUserStore();

  // 還原狀態（例如從 localStorage 讀取）
  if (!userStore.isLoggedIn && localStorage.getItem('user')) {
    userStore.restore();
  }

  // 若需要登入，且尚未登入，或登入但 token 過期
  if (to.meta.requiresAuth) {
    if (!userStore.token) {
      Notify.create({ type: 'warning', message: '請先登入', position: 'center', timeout: 1000 });

      // ⬇️ 儲存使用者原本要去的頁面
      userStore.loginRedirectPath = to.fullPath;

      // ⬇️ 改導回首頁（或你預設顯示登入元件的頁面）
      next('/');

      // ⬇️ 延遲開啟登入彈窗
      setTimeout(() => {
        userStore.showLoginModal = true;
      }, 100);
      return;
    }

    try {
      // 驗證 token 是否有效
      const res = await api.get('/user/getCurrentUser', {
        headers: {
          Authorization: `Bearer ${userStore.token}`,
        },
      });
      console.log('登入回傳資料:', res.data);
      void userStore.setUser({
        username: res.data.user.username,
        role: res.data.user.role,
        avatar: res.data.user.avatar?.trim() || userStore.avatar,
        token: userStore.token,
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      Notify.create({ type: 'negative', message: '登入憑證失效，請重新登入', position: 'center' });
      // 改導回首頁或指定頁
      next('/');

      // 延遲開啟登入元件（等畫面渲染完）
      setTimeout(() => {
        userStore.showLoginModal = true;
      }, 100);

      return;
    }
  }

  // 若該路由需要管理員權限，但不是管理員
  if (to.meta.requiresAdmin && userStore.role !== UserRole.ADMIN) {
    Notify.create({
      type: 'negative',
      message: '無權限進入該頁面，將跳轉至首頁',
      position: 'center',
    });
    return next('/');
  }

  // 通過驗證
  next();
}
