const routes = [
  {
    path: '/',
    redirect: '/chat',
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
];

export default routes;
