import { defineRouter } from '#q-app/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import routes from './routes';
import { useUserStore } from 'src/stores/userStore';
import { Notify } from 'quasar';

export default defineRouter(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  // 登入驗證
  Router.beforeEach((to, from, next) => {
    const userStore = useUserStore();

    if (!userStore.isLoggedIn) {
      userStore.restore(); // 嘗試從 localStorage 還原狀態
    }

    if (to.meta.requiresAuth && !userStore.isLoggedIn) {
      Notify.create({
        type: 'warning',
        message: '請先登入後再操作',
        position: 'center',
        timeout: 1500,
      });
      next('/'); // 未登入導回首頁或導向 /login
    } else {
      next();
    }
  });

  return Router;
});
