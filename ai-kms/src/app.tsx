import UserCenterModal from '@/components/userCenterModal';
import { LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import { history,request as umiRequest } from '@umijs/max';
import { Dropdown, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { postRefresh } from './services/api/renzhengAuth';

//  全局状态初始化：用来判断用户是否登录，没登录就踢回登录页
export async function getInitialState() {
  const token = localStorage.getItem('accessToken');
  const userStr = localStorage.getItem('user');

  // 如果没有 token 且当前不在登录页，强制跳回登录页
  if (!token && history.location.pathname !== '/login') {
    history.push('/login');
    return { currentUser: undefined };
  }
  let currentUser = undefined;
  if (userStr) {
    try {
      currentUser = JSON.parse(userStr);
    } catch (e) {}
  }
  return { currentUser };
}

//  全局网络请求配置
export const request = {
  // 统一增加 API 前缀会自动变成 request('/api/v1/kb')
  baseURL: '/api/v1',

  // 请求拦截器，自动从保险柜取出 Token 挂在 Header 上
  requestInterceptors: [
    (url: string, options: any) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        };
      }
      return { url, options };
    },
  ],
  responseInterceptors: [
    [
      (response: any) => response,
      async (error: any) => {
        const { response } = error;
        if (
          response &&
          response.status === 401 &&
          !response.config.url.includes('/refresh')
        ) {
          const refreshToken = localStorage.getItem('refreshToken');
          if(refreshToken){
            try{
              const res=await postRefresh({refresh_token: refreshToken});
              if(res.code===200 && res.data?.accessToken){
                localStorage.setItem('accessToken',res.data.accessToken)

                const {config}=error;
                config.headers.Authorization=`Bearer ${res.data.accessToken}`;
                return umiRequest(config.url,config);
              }
            } catch(refreshError){
              localStorage.clear();
              window.location.href='/login';
            }
          }
        }
        return Promise.reject(error);
      },
    ],
  ],
};
//弹窗全局包裹器
const AppWrapper = ({ children, initialState, setInitialState }: any) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  useEffect(() => {
    const handleOpen = () => setIsModalOpen(true);
    window.addEventListener('openUserCenter', handleOpen);
    return () => window.removeEventListener('openUserCenter', handleOpen);
  }, []);
  // 更新用户信息的统一回调
  const handleUpdateUser = (newUser: any) => {
    setInitialState((s: any) => ({ ...s, currentUser: newUser }));
    localStorage.setItem('user', JSON.stringify(newUser));
  };
  return (
    <>
      {children}
      <UserCenterModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={initialState?.currentUser}
        onUpdateUser={handleUpdateUser}
      />
    </>
  );
};

export const layout = ({ initialState, setInitialState }: any) => {
  return {
    // 配置左下角的头像和菜单
    avatarProps: {
      src:
        initialState?.currentUser?.avatar ||
        'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png',
      title: initialState?.currentUser?.username || '管理员',
      name: initialState?.currentUser?.username || '管理员',
      size: 'small',
      render: (_: any, avatarChilden: React.ReactNode) => {
        const handleLogout = () => {
          localStorage.clear();
          history.push('/login');
        };
        const handleOpenSettings = () => {
          window.dispatchEvent(new Event('openUserCenter'));
        };

        return (
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                {
                  key: 'setting',
                  icon: <SettingOutlined />,
                  label: '个人设置',
                  onClick: handleOpenSettings,
                },
                {
                  type: 'divider',
                },
                {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: '退出登录',
                  onClick: handleLogout,
                },
              ],
            }}
          >
            <div className="cursor-pointer">
              {/* 把原始的头像组件作为 children 传进去 */}
              {avatarChilden}
            </div>
          </Dropdown>
        );
      },
    },
    childrenRender: (children: any) => {
      return (
        <AppWrapper
          initialState={initialState}
          setInitialState={setInitialState}
        >
          {children}
        </AppWrapper>
      );
    },
  };
};
