import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'Home', component: () => import('pages/AboutPage.vue') },
      { path: 'draw', name: 'Index', component: () => import('pages/IndexPage.vue') },
      { path: 'about', redirect: '/' }, // 保留 about 路徑但重新導向到首頁
      {
        path: 'setting',
        component: () => import('pages/SettingPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        name: 'MapSearch',
        path: 'mapsearch',
        component: () => import('pages/MapSearch.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'FoodDrawHistory',
        component: () => import('pages/FoodDrawHistory.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'LoginHistory',
        component: () => import('pages/LoginHistory.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },
  {
    path: '/admin',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/Admin/AdminPage.vue'),
        meta: {
          requiresAuth: true,
          requiresAdmin: true,
        },
      },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
