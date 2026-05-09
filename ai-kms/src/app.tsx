import { history } from '@umijs/max';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons'; 
import { Dropdown } from 'antd'; 
import React from 'react';

//  全局状态初始化：用来判断用户是否登录，没登录就踢回登录页
export async function getInitialState() {
  const token = localStorage.getItem('token');

  // 如果没有 token 且当前不在登录页，强制跳回登录页
  if (!token && history.location.pathname !== '/login') {
    history.push('/login');
  }

  if (token) {
    return { currentUser: { name: '管理员' } };
  }
  return { currentUser: undefined };
}

//  全局网络请求配置 
export const request = {
  // 统一增加 API 前缀会自动变成 request('/api/v1/kb')
  baseURL: '/api/v1',

  // 请求拦截器，自动从保险柜取出 Token 挂在 Header 上
  requestInterceptors: [
    (url: string, options: any) => {
      const token = localStorage.getItem('token');
      if (token) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token}`, 
        };
      }
      return { url, options };
    },
  ],
};

export const layout=()=>{
  return {
    // 配置左下角的头像和菜单
    avatarProps: {
      src: 'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png',
      title: '管理员',
      size:'small',
      render:(_:any, avatarChilden: React.ReactNode)=>{

        const handleLogout=()=>{
          localStorage.removeItem('token');
          history.push('/login'); 
        }

        return (
          <Dropdown
            menu={{
              items: [
                {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: '退出登录',
                  onClick: handleLogout,
                },
              ],
            }}
          >
            {/* 把原始的头像组件作为 children 传进去 */}
            {avatarChilden}
          </Dropdown>
        );
      }
    },
  };
}
