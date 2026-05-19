import access from "@/access";

const routes = [
  {
    path: '/',
    redirect: '/chat',
  },
  {
    path: '/login',
    component: './login',
    layout: false,
  },
  {
    name: '智能问答',
    path: '/chat',
    component: './chat',
  },
  {
    name: '知识库管理',
    path: '/kb',
    component: './kb',
  },
  {
    name: '用户管理',
    path: '/userManage',
    component: './userManage',
    access: 'canAdmin',
  },
  {
    name: '系统设置',
    path: '/settings',
    component: './settings',
    access: 'canAdmin',
  },
];

export default routes;
