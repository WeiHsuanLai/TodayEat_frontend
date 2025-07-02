import { defineRouter } from '#q-app/wrappers';
import { createMemoryHistory, createRouter, createWebHistory } from 'vue-router';
import routes from './routes';
import { authGuard } from './guards/authGuard';

export default defineRouter(function (/* { store, ssrContext } */) {
  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: process.env.SERVER ? createMemoryHistory() : createWebHistory(),
  });

  // 登入驗證
  Router.beforeEach(authGuard);

  return Router;
});
